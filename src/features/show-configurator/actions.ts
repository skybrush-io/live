import delay from 'delay';
import type { Feature as OLFeature } from 'ol';
import { ModifyEvent } from 'ol/interaction/Modify';
import { getDistance as haversineDistance } from 'ol/sphere';

import { findAssignmentBetweenPoints } from '~/algorithms/matching';
import type { TransformFeaturesInteractionEvent } from '~/components/map/interactions/TransformFeatures';
import { errorToString } from '~/error-handling';
import { getBase64ShowBlob } from '~/features/show/selectors';
import { showError } from '~/features/snackbar/actions';
import { getAllValidUAVPositions } from '~/features/uavs/selectors';
import messageHub from '~/message-hub';
import { type GPSPosition } from '~/model/geography';
import {
  GROSS_CONVEX_HULL_AREA_ID,
  NET_CONVEX_HULL_AREA_ID,
  areaIdToGlobalId,
  globalIdToAreaId,
  globalIdToHomePositionId,
  homePositionIdToGlobalId,
  isHomePositionId,
} from '~/model/identifiers';
import type { AppThunk } from '~/store/reducers';
import type { Identifier } from '~/utils/collections';
import { writeBlobToFile } from '~/utils/filesystem';
import type { EasNor, Easting, LonLat, Northing } from '~/utils/geography';
import { toDegrees } from '~/utils/math';

import {
  getHomePositions,
  getHomePositionsInWorldCoordinates,
  selectAdaptedShowAsBlob,
  selectCoordinateSystem,
} from './selectors';
import {
  historyInit,
  historySnap,
  moveHomePositionsByMapCoordinateDelta,
  moveHomePositionsToLonLat,
  moveOutdoorShowOriginByMapCoordinateDelta,
  rotateHomePositions,
  rotateShow,
  setAdaptResult,
  showDialog,
  updateSelection,
  type ShowData,
} from './state';

// -- Initializing

export const showDialogAndClearUndoHistory =
  (showData?: ShowData): AppThunk =>
  (dispatch) => {
    dispatch(showDialog(showData));
    dispatch(historyInit());
  };

// -- Selection

export const selectAllModifiableItems =
  (): AppThunk => (dispatch, getState) => {
    const state = getState();
    const homePositions = getHomePositionsInWorldCoordinates(state) ?? [];
    dispatch(
      updateSelection('set', [
        ...homePositions.map((_, i) => homePositionIdToGlobalId(String(i))),
        areaIdToGlobalId(GROSS_CONVEX_HULL_AREA_ID),
        areaIdToGlobalId(NET_CONVEX_HULL_AREA_ID),
      ])
    );
  };

export const clearSelection = (): AppThunk => (dispatch) =>
  dispatch(updateSelection('clear', [])); // TODO: Empty list is redundant...

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
const updateConvexHull =
  (options: FeatureUpdateOptions): AppThunk =>
  (dispatch) => {
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
          angle: toDegrees(event.angleDelta),
        })
      );
      // NOTE: Rotate the home positions in the opposite direction to
      //       cancel out the transformation and keep them in place.
      dispatch(
        rotateHomePositions({
          rotationOriginInMapCoordinates: event.origin,
          angle: toDegrees(-event.angleDelta),
        })
      );
    }
  };

/**
 * Handles home position changes.
 *
 * @param globalIds The global IDs of the home positions to update or
 *                 `undefined` if all home positions should be updated.
 * @param options Feature update options.
 */
const updateHomePositions =
  (
    globalIds: Identifier[] | undefined,
    options: FeatureUpdateOptions
  ): AppThunk =>
  (dispatch) => {
    if (!isTransformInteraction(options)) {
      console.warn(
        'Only transformation events are supported for the home positions.'
      );
      return;
    }

    const { event } = options;

    const homePositionIndexes =
      globalIds === undefined
        ? undefined
        : globalIds.reduce<Record<number, true>>((acc, globalId) => {
            const index = Number.parseInt(
              globalIdToHomePositionId(globalId) ?? '',
              10
            );
            if (Number.isFinite(index)) {
              acc[index] = true;
            }

            return acc;
          }, {});

    if (event.subType === 'move') {
      dispatch(
        moveHomePositionsByMapCoordinateDelta({
          delta: event.delta,
          drones: homePositionIndexes,
        })
      );
    } else if (event.subType === 'rotate' && event.angleDelta && event.origin) {
      dispatch(
        rotateHomePositions({
          rotationOriginInMapCoordinates: event.origin,
          angle: toDegrees(event.angleDelta),
          drones: homePositionIndexes,
        })
      );
    }
  };

/**
 * Updates the features that have been modified on the map.
 */
export const updateModifiedFeatures =
  (features: OLFeature[], options: FeatureUpdateOptions): AppThunk =>
  (dispatch) =>
  (): void => {
    // -- Reset adapt result
    dispatch(setAdaptResult(undefined));

    const requiresUpdate = {
      convexHull: false,
      homePositionIds: [] as Identifier[],
      allHomePositions: false,
    };

    for (const feature of features) {
      const gid = feature.getId();
      if (!(typeof gid === 'string')) {
        console.warn('Non-string global feature ID:', gid);
        continue;
      }

      const areaId = globalIdToAreaId(gid);
      if (areaId === NET_CONVEX_HULL_AREA_ID) {
        requiresUpdate.convexHull = true;
      } else if (areaId === GROSS_CONVEX_HULL_AREA_ID) {
        requiresUpdate.convexHull = true;
        requiresUpdate.allHomePositions = true;
      } else if (isHomePositionId(gid)) {
        requiresUpdate.homePositionIds.push(gid);
      }
    }

    // -- Update features
    if (requiresUpdate.convexHull) {
      dispatch(updateConvexHull(options));
    }

    if (requiresUpdate.allHomePositions) {
      dispatch(updateHomePositions(undefined, options));
    } else if (requiresUpdate.homePositionIds.length > 0) {
      dispatch(updateHomePositions(requiresUpdate.homePositionIds, options));
    }

    dispatch(historySnap());
  };

/**
 * Action that adjusts home positions to the current drone positions
 * if possible.
 */
export const adjustHomePositionsToDronePositions =
  (): AppThunk => (dispatch, getState) => {
    // Only outdoor shows are supported by the dialog.
    const homePositions = getHomePositionsInWorldCoordinates(getState());
    const dronePositions = getAllValidUAVPositions(getState());
    if (homePositions === undefined || dronePositions.length === 0) {
      console.warn(
        'adjustHomePositionsToDronePositions(): no home positions or drones.'
      );
      return;
    }

    // TODO: move this calculation to a web worker to avoid blocking the UI
    const assignment = findAssignmentBetweenPoints(
      homePositions,
      dronePositions,
      {
        distanceFunction: haversineDistance,
        getter: (item: GPSPosition): LonLat =>
          item ? [item.lon, item.lat] : ([Number.NaN, Number.NaN] as LonLat),
        matching: { algorithm: 'greedy' },
      }
    );

    const newPositions = assignment.map(
      ([homePositionIndex, dronePositionIndex]): [
        number,
        LonLat | undefined,
      ] => {
        const pos = dronePositions[dronePositionIndex];
        return [homePositionIndex, pos ? [pos.lon, pos.lat] : undefined];
      }
    );

    dispatch(moveHomePositionsToLonLat(newPositions));
    dispatch(historySnap());
  };

// -- Show adapt

type Meters = number;
type MetersPerSecond = number;
type Seconds = number;

export type OptionalShowAdaptParameters = {
  altitude?: Meters | undefined;
  minDistance?: Meters | undefined;
  horizontalVelocity?: MetersPerSecond | undefined;
  verticalVelocity?: MetersPerSecond | undefined;
  takeoffDuration?: Seconds | undefined;
};

export type ShowAdaptParameters = Required<OptionalShowAdaptParameters>;

/**
 * Default light configuration.
 */
type DefaultConfiguration = {
  type: 'default';

  /**
   * Brightness in the [0,1] interval.
   */
  brightness: number;
};

/**
 * "Off" configuration, no lights.
 */
type OffConfiguration = {
  type: 'off';
};

/**
 * "Original" configuration that attempts to keep the
 * existing light configuration.
 */
type OriginalConfiguration = {
  type: 'original';
};

/**
 * Solid colored lights configuration.
 */
type SolidConfiguration = {
  type: 'solid';

  /**
   * RGB color code.
   */
  color: string;
};

/**
 * Sparks with an off duration between them.
 */
type SparksConfiguration = {
  type: 'sparks';
  off_duration: number;
};

/**
 * Light effect types.
 */
export type LightEffectType =
  | DefaultConfiguration['type']
  | OffConfiguration['type']
  | OriginalConfiguration['type']
  | SolidConfiguration['type']
  | SparksConfiguration['type'];

/**
 * Light effect configurations.
 */
export type LightEffectConfiguration =
  | DefaultConfiguration
  | OffConfiguration
  | OriginalConfiguration
  | SolidConfiguration
  | SparksConfiguration;

export const adaptShow =
  (params: ShowAdaptParameters, lights: LightEffectConfiguration): AppThunk =>
  async (dispatch, getState) => {
    const state = getState();

    // Note(vp): it would be safer to copy the base64 encoded show to the dialog's state
    // instead of reading it from the show state. But this data shouldn't change in the
    // background so this way we can save some memory. Maybe store and compare a hash
    // if this becomes an issue.
    const base64ShowBlob = getBase64ShowBlob(state);
    const positions = getHomePositions(state);
    const coordinateSystem = selectCoordinateSystem(state);

    const common = {
      min_distance: params.minDistance,
      velocity_xy: params.horizontalVelocity,
      velocity_z: params.verticalVelocity,
      altitude: params.altitude,
      replace: true,
    };

    const transformations = [
      {
        type: 'takeoff',
        parameters: {
          positions,
          duration: params.takeoffDuration || undefined,
          lights,
          ...common,
        },
      },
      {
        type: 'rth',
        parameters: {
          lights,
          ...common,
        },
      },
    ];

    dispatch(setAdaptResult({ loading: true }));

    try {
      const { show, takeoffLengthChange, rthLengthChange } =
        // @ts-expect-error: ts(2339)

        await messageHub.query.adaptShow(
          base64ShowBlob,
          transformations,
          coordinateSystem
        );

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

export const reviewInViewer = (): AppThunk => async (dispatch, getState) => {
  const { bridge } = window;
  if (!bridge) {
    console.warn('This action is available only when running in Electron');
    return;
  }

  const { removeTemporaryFile, writeBufferToTemporaryFile } = bridge;
  const show = selectAdaptedShowAsBlob(getState());
  if (!show) {
    console.warn('No adapted show available');
    return;
  }

  let filename: string | undefined;
  try {
    try {
      filename = await writeBufferToTemporaryFile(await show.arrayBuffer(), {
        extension: 'skyc',
      });
    } catch (error) {
      dispatch(
        showError(
          errorToString(
            error,
            'Error while saving adapted show to a temporary file'
          )
        )
      );
    }

    if (filename) {
      try {
        await bridge.openPath(filename);
      } catch (error) {
        dispatch(
          showError(
            errorToString(
              error,
              'Error while opening adapted show in Skybrush Viewer'
            )
          )
        );
      }
    }

    await delay(60000);
  } finally {
    if (filename) {
      await removeTemporaryFile(filename);
    }
  }
};

export const saveAdaptedShow = (): AppThunk => async (_dispatch, getState) => {
  const adaptedBase64Show = selectAdaptedShowAsBlob(getState());
  if (adaptedBase64Show) {
    await writeBlobToFile(adaptedBase64Show, 'adapted-show.skyc');
  }
};
