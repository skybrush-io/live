import turfContains from '@turf/boolean-contains';
import { createSelector } from '@reduxjs/toolkit';

import {
  getFeaturesById,
  getFeaturesInOrder,
} from '~/features/map-features/selectors';
import { type FeatureWithProperties } from '~/features/map-features/types';
import { selectionForSubset } from '~/features/selection/selectors';
import {
  globalIdToMissionItemId,
  globalIdToMissionSlotId,
} from '~/model/identifiers';
import { type MissionIndex } from '~/model/missions';
import { type AppSelector } from '~/store/reducers';
import { type LonLat } from '~/utils/geography';
import { createGeometryFromPoints } from '~/utils/math';
import { EMPTY_ARRAY } from '~/utils/redux';

import {
  getConvexHullOfMissionInWorldCoordinates,
  getGeofencePolygonId,
  getMissionItemIds,
} from './local';

/**
 * Selector that calculates and caches the list of selected mission item IDs from
 * the state object.
 */
export const getSelectedMissionItemIds = selectionForSubset(
  globalIdToMissionItemId
);

/**
 * Selector that calculates and caches the list of selected mission indices from
 * the state object.
 */
export const getSelectedMissionSlotIds = selectionForSubset(
  globalIdToMissionSlotId
);

/**
 * Selector that returns at most five selected mission indices for sake of
 * displaying their trajectories.
 */
export const getSelectedMissionIndicesForTrajectoryDisplay: AppSelector<
  MissionIndex[]
> = createSelector(getSelectedMissionSlotIds, (selectedMissionSlotIds) =>
  selectedMissionSlotIds.length <= 5
    ? selectedMissionSlotIds.map(Number)
    : EMPTY_ARRAY
);

export const getItemIndexRangeForSelectedMissionItems: AppSelector<
  [number, number]
> = createSelector(
  getMissionItemIds,
  getSelectedMissionItemIds,
  (allIds, selectedIds) => {
    const indices = selectedIds.map((id) => allIds.indexOf(id));
    return [Math.min(...indices), Math.max(...indices)];
  }
);

/**
 * Returns whether the currently selected mission items form a single,
 * uninterrupted chunk in the list of mission items.
 */
export const areSelectedMissionItemsInOneChunk: AppSelector<boolean> =
  createSelector(
    getItemIndexRangeForSelectedMissionItems,
    getSelectedMissionItemIds,
    (indexRange, selectedIds) => {
      const [minIndex, maxIndex] = indexRange;
      return minIndex >= 0 && maxIndex === minIndex + selectedIds.length - 1;
    }
  );

export const createCanMoveSelectedMissionItemsByDeltaSelector = (
  delta: number
): AppSelector<boolean> =>
  createSelector(
    getMissionItemIds,
    areSelectedMissionItemsInOneChunk,
    getItemIndexRangeForSelectedMissionItems,
    (allIds, inOneChunk, indexRange) => {
      if (!inOneChunk) {
        return false;
      }

      const [minIndex, maxIndex] = indexRange;
      if (delta < 0) {
        return minIndex >= Math.abs(delta);
      } else {
        return maxIndex + delta < allIds.length;
      }
    }
  );

/**
 * Returns whether the currently selected mission items can be moved upwards
 * by one slot.
 */
export const canMoveSelectedMissionItemsUp: AppSelector<boolean> =
  createCanMoveSelectedMissionItemsByDeltaSelector(-1);

/**
 * Returns whether the currently selected mission items can be moved downwards
 * by one slot.
 */
export const canMoveSelectedMissionItemsDown: AppSelector<boolean> =
  createCanMoveSelectedMissionItemsByDeltaSelector(1);

/**
 * Gets the polygon that is to be used as a geofence.
 */
export const getGeofencePolygon: AppSelector<
  FeatureWithProperties | undefined
> = createSelector(
  getGeofencePolygonId,
  getFeaturesById,
  (geofencePolygonId, featuresById) =>
    typeof geofencePolygonId === 'string'
      ? featuresById[geofencePolygonId]
      : undefined
);

/**
 * Gets the coordinates of the polygon that is to be used as a geofence, in
 * world coordinates, or undefined if no geofence polygon is defined.
 */
export const getGeofencePolygonInWorldCoordinates: AppSelector<
  LonLat[] | undefined
> = createSelector(
  getGeofencePolygon,
  (geofencePolygon) => geofencePolygon?.points
);

/**
 * Returns whether a geofence is currently set by the user (either automatically)
 * or manually.
 */
export const hasActiveGeofencePolygon: AppSelector<boolean> = createSelector(
  getGeofencePolygonId,
  getFeaturesById,
  (geofencePolygonId, featuresById) =>
    geofencePolygonId !== undefined &&
    featuresById[geofencePolygonId] !== undefined
);

export const getExclusionZonePolygons: AppSelector<FeatureWithProperties[]> =
  createSelector(getFeaturesInOrder, (featuresInOrder) =>
    featuresInOrder.filter((f) => f.attributes?.['isExclusionZone'])
  );

/**
 * Returns whether the convex hull of the waypoint mission (home positions and
 * mission items) is fully contained inside the geofence polygon.
 */
export const isWaypointMissionConvexHullInsideGeofence: AppSelector<
  boolean | undefined
> = createSelector(
  getConvexHullOfMissionInWorldCoordinates,
  getGeofencePolygonInWorldCoordinates,
  (convexHullPoints, geofencePoints) => {
    if (
      geofencePoints !== undefined &&
      geofencePoints.length > 0 &&
      convexHullPoints !== undefined &&
      convexHullPoints.length > 0
    ) {
      const geofence = createGeometryFromPoints(geofencePoints);
      const convexHull = createGeometryFromPoints(convexHullPoints);
      return (
        geofence.isOk() &&
        convexHull.isOk() &&
        turfContains(geofence.value, convexHull.value)
      );
    } else {
      return false;
    }
  }
);
