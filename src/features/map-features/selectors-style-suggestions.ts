import { createSelector } from '@reduxjs/toolkit';

import { Colors } from '~/components/colors';
import { Tool } from '~/components/map/tools';
import { getSelectedTool } from '~/features/map/tools';
import { getGeofencePolygonId } from '~/features/mission/selectors';
import { getNameOfFeatureType } from '~/model/features';
import type { AppSelector } from '~/store/reducers';
import type { Identifier } from '~/utils/collections';

import { getFeatureById } from './selectors';

/**
 * Selector that returns whether the feature with a given id should be
 * represented using a filled style on the map if not specified otherwise.
 */
export const shouldFillFeature: AppSelector<boolean, [Identifier]> =
  createSelector(
    getFeatureById,
    getGeofencePolygonId,
    (feature, geofencePolygonId) =>
      feature?.filled ?? feature?.id !== geofencePolygonId
  );

/**
 * Selector that returns whether the points of a feature with a given id should
 * be shown if not specified otherwise.
 */
export const shouldShowPointsOfFeature: AppSelector<boolean, [Identifier]> =
  createSelector(
    getFeatureById,
    getSelectedTool,
    (feature, selectedTool) =>
      feature?.showPoints ?? selectedTool === Tool.EDIT_FEATURE
  );

/**
 * Selector that returns a suggested label that a feature should be given,
 * unless the user has manually set a different name.
 */
export const suggestedLabelForFeature: AppSelector<string, [Identifier]> =
  createSelector(
    getFeatureById,
    getGeofencePolygonId,
    (feature, geofencePolygonId) =>
      // prettier-ignore
      feature?.label ?? (
        feature?.id === geofencePolygonId ? 'Geofence' :
        feature?.attributes?.['isExclusionZone'] ? 'Exclusion zone' :
        feature?.type ? getNameOfFeatureType(feature?.type) :
        'Feature'
      )
  );

/**
 * Selector that returns a suggested color that a feature with a given id should
 * be shown in, unless the user has manually selected a different option.
 */
export const suggestedColorForFeature: AppSelector<string, [Identifier]> =
  createSelector(
    getFeatureById,
    getGeofencePolygonId,
    (feature, geofencePolygonId) =>
      feature?.color ??
      (feature?.id === geofencePolygonId ||
      feature?.attributes?.['isExclusionZone']
        ? Colors.geofence
        : Colors.main)
  );
