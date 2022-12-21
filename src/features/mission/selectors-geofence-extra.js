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
  getMissionType,
  hasActiveGeofencePolygon,
  isWaypointMissionConvexHullInsideGeofence,
} from './selectors';

export const getGeofenceValidatorBasedOnMissionType = createSelector(
  isShowConvexHullInsideGeofence,
  isWaypointMissionConvexHullInsideGeofence,
  getMissionType,
  (showInsideGeofence, waypointMissionInsideGeofence, missionType) =>
    ({
      [MissionType.SHOW]: showInsideGeofence,
      [MissionType.WAYPOINT]: waypointMissionInsideGeofence,
    }[missionType])
);

export const getGeofenceStatus = createSelector(
  hasActiveGeofencePolygon,
  getGeofencePolygon,
  getGeofenceValidatorBasedOnMissionType,
  getMissionType,
  (hasActiveGeofencePolygon, geofencePolygon, validator, missionType) => {
    return !hasActiveGeofencePolygon
      ? Status.OFF
      : !validator
      ? Status.ERROR
      : geofencePolygon.owner === missionType
      ? Status.SUCCESS
      : Status.WARNING;
  }
);
