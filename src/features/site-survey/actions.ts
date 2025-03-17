import type { Feature as OLFeature } from 'ol';
import { ModifyEvent } from 'ol/interaction/Modify';
import { batch } from 'react-redux';

import type { TransformFeaturesInteractionEvent } from '~/components/map/interactions/TransformFeatures';
import { CONVEX_HULL_AREA_ID, globalIdToAreaId } from '~/model/identifiers';
import type { AppDispatch } from '~/store/reducers';
import { type Coordinate2D, toDegrees } from '~/utils/math';

import {
  moveHomePositionsByMapCoordinateDelta,
  moveOutdoorShowOriginByMapCoordinateDelta,
  rotateHomePositions,
  rotateShow,
} from './state';

export type FeatureUpdateType = 'modify' | 'transform';
export type FeatureUpdateOptions = {
  event: ModifyEvent | TransformFeaturesInteractionEvent;
  type: FeatureUpdateType;
};

/**
 * Handles the convex hull feature changes.
 */
function updateConvexHull(
  dispatch: AppDispatch,
  options: FeatureUpdateOptions
) {
  if (options.type !== 'transform') {
    console.warn('This transformation is not handled for the convex hull yet');
    return;
  }

  const { event } = options;
  if (event instanceof ModifyEvent) {
    console.warn(
      'This event type is not supported for the convex hull:',
      event
    );
    return;
  }

  if (event.subType === 'move' && event.delta) {
    const delta: Coordinate2D = event.delta;
    dispatch(moveOutdoorShowOriginByMapCoordinateDelta(delta));
    dispatch(moveHomePositionsByMapCoordinateDelta([-delta[0], -delta[1]]));
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
