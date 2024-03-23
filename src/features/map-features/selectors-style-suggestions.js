import { createSelector } from '@reduxjs/toolkit';

import { Colors } from '~/components/colors';
import { getSelectedTool } from '~/features/map/tools';
import { Tool } from '~/views/map/tools';
import { getGeofencePolygonId } from '../mission/selectors';

/**
 * Selector that returns whether the feature with a given id should be
 * represented using a filled style on the map if not specified otherwise.
 */
export const shouldFillFeature = createSelector(
  getGeofencePolygonId,
  (_state, featureId) => featureId,
  (geofencePolygonId, featureId) => featureId !== geofencePolygonId
);

/**
 * Selector that returns whether the points of a feature with a given id should
 * be shown if not specified otherwise.
 */
export const shouldShowPointsOfFeature = createSelector(
  getSelectedTool,
  (selectedTool) => selectedTool === Tool.EDIT_FEATURE
);

/**
 * Selector that returns a suggested color that a feature with a given id should
 * be shown in, unless the user has manually selected a different option.
 */
export const suggestedColorForFeature = createSelector(
  getGeofencePolygonId,
  (state, featureId) => state.features.byId[featureId],
  (geofencePolygonId, feature) =>
    feature.id === geofencePolygonId || feature.attributes?.isExclusionZone
      ? Colors.geofence
      : Colors.main
);
