/**
 * @file These selectors need to be separated from the rest in order to avoid
 *       circular imports between the mission and the show selectors.
 */

import { createSelector } from '@reduxjs/toolkit';

import { Status } from '~/components/semantics';
import { isShowConvexHullInsideGeofence } from '~/features/show/selectors';
import { MissionType } from '~/model/missions';

import {
  getGeofencePolygon,
  hasActiveGeofencePolygon,
  isWaypointMissionConvexHullInsideGeofence,
} from './composed';
import { getMissionType } from './local';

export const isGeofenceValidBasedOnMissionType = createSelector(
  isShowConvexHullInsideGeofence,
  isWaypointMissionConvexHullInsideGeofence,
  getMissionType,
  (showInsideGeofence, waypointMissionInsideGeofence, missionType) =>
    ({
      [MissionType.SHOW]: showInsideGeofence,
      [MissionType.WAYPOINT]: waypointMissionInsideGeofence,
    })[missionType]
);

export const getGeofenceStatus = createSelector(
  hasActiveGeofencePolygon,
  getGeofencePolygon,
  isGeofenceValidBasedOnMissionType,
  getMissionType,
  (hasActiveGeofencePolygon, geofencePolygon, geofenceValid, missionType) => {
    return !hasActiveGeofencePolygon
      ? Status.OFF
      : !geofenceValid
        ? Status.ERROR
        : geofencePolygon.owner === missionType
          ? Status.SUCCESS
          : Status.WARNING;
  }
);
