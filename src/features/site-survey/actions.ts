import type { Feature as OLFeature } from 'ol';
import { ModifyEvent } from 'ol/interaction/Modify';
import { batch } from 'react-redux';

import type { TransformFeaturesInteractionEvent } from '~/components/map/interactions/TransformFeatures';
import { getBase64ShowBlob } from '~/features/show/selectors';
import messageHub from '~/message-hub';
import {
  CONVEX_HULL_AREA_ID,
  globalIdToAreaId,
  globalIdToHomePositionId,
  isHomePositionId,
} from '~/model/identifiers';
import type { AppDispatch, AppThunk } from '~/store/reducers';
import type { Identifier } from '~/utils/collections';
import type { EasNor, Easting, Northing } from '~/utils/geography';
import { toDegrees } from '~/utils/math';

import { getHomePositions } from './selectors';
import {
  moveHomePositionsByMapCoordinateDelta,
  moveOutdoorShowOriginByMapCoordinateDelta,
  rotateHomePositions,
  rotateShow,
  setAdaptResult,
} from './state';

// -- Transformations

export type FeatureUpdateType = 'modify' | 'transform';

type TransformUpdateOptions = {
  event: TransformFeaturesInteractionEvent;
  type: 'transform';
};

type ModifyUpdateOptions = {
  event: ModifyEvent;
  type: 'modify';
};

export type FeatureUpdateOptions = TransformUpdateOptions | ModifyUpdateOptions;

/**
 * Type guard that checks if the given options are for a transformation event.
 */
function isTransformInteraction(
  options: FeatureUpdateOptions
): options is TransformUpdateOptions {
  return (
    options.type === 'transform' &&
    // This check houldn't be necessary, but do it anyway to be on the safe side.
    !(options.event instanceof ModifyEvent)
  );
}

/**
 * Handles convex hull feature changes.
 */
function updateConvexHull(
  dispatch: AppDispatch,
  options: FeatureUpdateOptions
) {
  if (!isTransformInteraction(options)) {
    console.warn(
      'Only transformation events are supported for the convex hull.'
    );
    return;
  }

  const { event } = options;

  if (event.subType === 'move' && event.delta) {
    const delta: EasNor = event.delta;
    dispatch(moveOutdoorShowOriginByMapCoordinateDelta(delta));
    dispatch(
      moveHomePositionsByMapCoordinateDelta({
        // NOTE: Type assertions justified by simple unary minus operation
        delta: [-delta[0] as Easting, -delta[1] as Northing],
      })
    );
  } else if (event.subType === 'rotate' && event.angleDelta && event.origin) {
    dispatch(
      rotateShow({
        rotationOriginInMapCoordinates: event.origin,
        angle: toDegrees(-event.angleDelta),
      })
    );
    dispatch(
      rotateHomePositions({
        rotationOriginInMapCoordinates: event.origin,
        angle: toDegrees(event.angleDelta),
      })
    );
  }
}

/**
 * Handles home position changes.
 */
function updateHomePositions(
  dispatch: AppDispatch,
  globalIds: Identifier[],
  options: FeatureUpdateOptions
) {
  if (!isTransformInteraction(options)) {
    console.warn(
      'Only transformation events are supported for the home positions.'
    );
    return;
  }

  const { event } = options;

  const homePositionIndexes = globalIds.reduce(
    (acc, globalId) => {
      const index = Number.parseInt(globalIdToHomePositionId(globalId) ?? '');
      if (Number.isFinite(index)) {
        acc[index] = true;
      }
      return acc;
    },
    {} as Record<number, true>
  );

  if (event.subType === 'move') {
    const delta: EasNor = event.delta;

    dispatch(
      moveHomePositionsByMapCoordinateDelta({
        delta,
        drones: homePositionIndexes,
      })
    );
  } else if (event.subType === 'rotate' && event.angleDelta && event.origin) {
    dispatch(
      rotateHomePositions({
        rotationOriginInMapCoordinates: event.origin,
        angle: toDegrees(-event.angleDelta),
        drones: homePositionIndexes,
      })
    );
  }
}

/**
 * Updates the features that have been modified on the map.
 */
export const updateModifiedFeatures = (
  dispatch: AppDispatch,
  features: OLFeature[],
  options: FeatureUpdateOptions
) =>
  // Using batch will not be necessary after upgrading to React 18.
  // See https://react-redux.js.org/api/batch
  batch(() => {
    // -- Reset adapt result
    dispatch(setAdaptResult(undefined));

    // -- Collect updatable feature IDs
    const updatedIds = {
      convexHull: [] as Identifier[],
      homePositions: [] as Identifier[],
    };
    for (const feature of features) {
      const gid = feature.getId();
      if (!(typeof gid === 'string')) {
        console.warn('Non-string global feature ID:', gid);
        continue;
      }

      if (globalIdToAreaId(gid) === CONVEX_HULL_AREA_ID) {
        updatedIds.convexHull.push(gid);
      } else if (isHomePositionId(gid)) {
        updatedIds.homePositions.push(gid);
      }
    }

    // -- Update features
    if (updatedIds.convexHull.length === 1) {
      updateConvexHull(dispatch, options);
    }
    if (updatedIds.homePositions.length > 0) {
      updateHomePositions(dispatch, updatedIds.homePositions, options);
    }
  });

// -- Show adapt

type Meters = number;
type MetersPerSecond = number;

type TakeoffParameters = {
  altitude: Meters;
  velocity: MetersPerSecond;
};

type RTHParameters = {
  horizontalVelocity: MetersPerSecond;
  verticalVelocity: MetersPerSecond;
};

export type ShowAdaptParameters = {
  minDistance: Meters;
  takeoff: TakeoffParameters;
  rth: RTHParameters;
};

export const adaptShow =
  (params: ShowAdaptParameters): AppThunk =>
  async (dispatch, getState) => {
    const state = getState();

    // Note(vp): it would be safer to copy the base64 encoded show to the dialog's state
    // instead of reading it from the show state. But this data shouldn't change in the
    // background so this way we can save some memory. Maybe store and compare a hash
    // if this becomes an issue.
    const base64ShowBlob = getBase64ShowBlob(state);
    const positions = getHomePositions(state);

    const common = {
      min_distance: params.minDistance,
      replace: true,
    };
    const transformations = [
      {
        type: 'takeoff',
        parameters: {
          positions,
          altitude: params.takeoff.altitude,
          speed: params.takeoff.velocity,
          ...common,
        },
      },
      {
        type: 'rth',
        parameters: {
          velocity_xy: params.rth.horizontalVelocity,
          velocity_z: params.rth.verticalVelocity,
          ...common,
        },
      },
    ];

    dispatch(setAdaptResult({ loading: true }));

    try {
      const { show, takeoffLengthChange, rthLengthChange } =
        // @ts-ignore ts(2339)
        await messageHub.query.adaptShow(base64ShowBlob, transformations);

      dispatch(setAdaptResult({ show, takeoffLengthChange, rthLengthChange }));
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : 'Unknown error type.';
      dispatch(setAdaptResult({ error: errorMessage }));
    }
  };
