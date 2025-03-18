import type { Feature as OLFeature } from 'ol';
import { ModifyEvent } from 'ol/interaction/Modify';
import { batch } from 'react-redux';

import type { TransformFeaturesInteractionEvent } from '~/components/map/interactions/TransformFeatures';
import {
  CONVEX_HULL_AREA_ID,
  globalIdToAreaId,
  globalIdToHomePositionId,
  isHomePositionId,
} from '~/model/identifiers';
import type { AppDispatch } from '~/store/reducers';
import { type EasNor, type Easting, type Northing } from '~/utils/geography';
import { toDegrees } from '~/utils/math';

import {
  moveHomePositionsByMapCoordinateDelta,
  moveOutdoorShowOriginByMapCoordinateDelta,
  rotateHomePositions,
  rotateShow,
} from './state';

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
function updateHomePosition(
  dispatch: AppDispatch,
  globalId: string,
  options: FeatureUpdateOptions
) {
  if (!isTransformInteraction(options)) {
    console.warn(
      'Only transformation events are supported for the home positions.'
    );
    return;
  }

  const { event } = options;

  if (event.subType !== 'move') {
    console.warn('Only move events are supported for the home positions.');
    return;
  }

  const homePositionId = globalIdToHomePositionId(globalId);
  if (homePositionId === undefined) {
    console.warn('Invalid home position ID:', globalId);
    return;
  }

  const homePositionIndex = Number.parseInt(homePositionId);
  if (!Number.isFinite(homePositionIndex)) {
    console.warn('Invalid home position ID:', globalId);
  }

  const delta: EasNor = event.delta;

  dispatch(
    moveHomePositionsByMapCoordinateDelta({
      delta,
      drones: { [homePositionIndex]: true },
    })
  );
}

/**
 * Handles the modification of a single feature on the map.
 */
function updateFeature(
  dispatch: AppDispatch,
  feature: OLFeature,
  options: FeatureUpdateOptions
) {
  // Partial, modified version of_handleFeatureUpdatesInOpenLayers() in model/openlayers.js
  // TODO(vp): refactor openlayers.js to avoid code duplication.
  const globalId = feature.getId();
  if (!(typeof globalId === 'string')) {
    console.warn('Non-string global feature ID:', globalId);
    return;
  }

  if (globalIdToAreaId(globalId) === CONVEX_HULL_AREA_ID) {
    return updateConvexHull(dispatch, options);
  } else if (isHomePositionId(globalId)) {
    return updateHomePosition(dispatch, globalId, options);
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
    for (const feature of features) {
      updateFeature(dispatch, feature, options);
    }
  });
