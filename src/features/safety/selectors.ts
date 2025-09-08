import max from 'lodash-es/max';
import unary from 'lodash-es/unary';
import { err, ok, type Result } from 'neverthrow';

import { createSelector } from '@reduxjs/toolkit';

import * as TurfHelpers from '@turf/helpers';

import {
  getConvexHullOfMissionInMapViewCoordinates,
  getGeofencePolygonInWorldCoordinates,
  getGPSBasedHomePositionsInMission,
  getMaximumHeightOfWaypoints,
  getMaximumHorizontalDistanceFromHomePositionInWaypointMission,
  getMissionType,
} from '~/features/mission/selectors';
import {
  getConvexHullOfShow,
  getMaximumHeightInTrajectories,
  getMaximumHorizontalDistanceFromTakeoffPositionInTrajectories,
  getOutdoorShowToWorldCoordinateSystemTransformationObject,
} from '~/features/show/selectors';
import { MissionType } from '~/model/missions';
import { type AppSelector } from '~/store/reducers';
import { rejectNullish } from '~/utils/arrays';
import {
  type EasNor,
  type LonLat,
  lonLatFromMapViewCoordinate,
  mapViewCoordinateFromLonLat,
  turfDistanceInMeters,
} from '~/utils/geography';

import { type SafetyDialogTab } from './constants';
import { type SafetySliceState } from './slice';
import {
  makeGeofenceGenerationSettingsApplicator,
  proposeDistanceLimit,
  proposeHeightLimit,
} from './utils';

/**
 * Selector that returns whether the safety dialog is open.
 */
export const isSafetyDialogOpen: AppSelector<boolean> = (state) =>
  state.safety.dialog.open;

/**
 * Selector that determines the selected tab of the safety dialog.
 */
export const getSelectedTabInSafetyDialog: AppSelector<SafetyDialogTab> = (
  state
) => state.safety.dialog.selectedTab;

/**
 * Selector that returns the currently set geofence preferences of the user.
 */
export const getGeofenceSettings: AppSelector<SafetySliceState['geofence']> = (
  state
) => state.safety.geofence;

/**
 * Selector that returns the currently set safety preferences of the user.
 */
export const getSafetySettings: AppSelector<SafetySliceState['settings']> = (
  state
) => state.safety.settings;

/**
 * Selector that returns a function for applying the current geofence generation
 * preferences to a polygon, such as simplification (vertex count reduction) and
 * buffering (extension with an extra safety margin / padding zone).
 */
export const getGeofenceGenerationSettingsApplicator: AppSelector<
  (coordinates: EasNor[]) => Result<EasNor[], string>
> = createSelector(
  getGeofenceSettings,
  makeGeofenceGenerationSettingsApplicator
);

/**
 * Selector that returns a boundary polygon based on the currently loaded show.
 */
export const getBoundaryPolygonBasedOnShowTrajectories: AppSelector<
  Result<LonLat[], string>
> = createSelector(
  getConvexHullOfShow,
  getOutdoorShowToWorldCoordinateSystemTransformationObject,
  (coordinates, transformation) => {
    if (coordinates.length === 0) {
      return err('Did you load a show file?');
    }

    if (!transformation) {
      return err('Outdoor coordinate system not set up yet');
    }

    return ok(
      coordinates.map(unary(transformation.toLonLat.bind(transformation)))
    );
  }
);

/**
 * Selector that returns a boundary polygon based on the current mission items.
 */
export const getBoundaryPolygonBasedOnMissionItems: AppSelector<
  Result<LonLat[], string>
> = createSelector(
  getConvexHullOfMissionInMapViewCoordinates,
  (coordinates) => {
    if (coordinates.length === 0) {
      return err('Are there valid mission items with coordinates?');
    }

    return ok(
      coordinates.map(unary<EasNor, LonLat>(lonLatFromMapViewCoordinate))
    );
  }
);

/**
 * Selector that returns a boundary polygon for the current mission type.
 */
export const getBoundaryPolygonForCurrentMissionType: AppSelector<
  Result<LonLat[], string>
> = createSelector(
  getMissionType,
  getBoundaryPolygonBasedOnShowTrajectories,
  getBoundaryPolygonBasedOnMissionItems,
  (
    missionType,
    boundaryPolygonBasedOnShowTrajectories,
    boundaryPolygonBasedOnMissionItems
  ) =>
    ({
      [MissionType.SHOW]: boundaryPolygonBasedOnShowTrajectories,
      [MissionType.WAYPOINT]: boundaryPolygonBasedOnMissionItems,
      [MissionType.UNKNOWN]: err('Unknown mission type'),
    })[missionType]
);

/**
 * Selector that returns a geofence polygon for the current mission type.
 */
export const getAutomaticGeofencePolygonForCurrentMissionType: AppSelector<
  Result<LonLat[], string>
> = createSelector(
  getBoundaryPolygonForCurrentMissionType,
  getGeofenceGenerationSettingsApplicator,
  (
    boundaryPolygonForCurrentMissionType,
    geofenceGenerationSettingsApplicator
  ) =>
    boundaryPolygonForCurrentMissionType
      .map((cs) => cs.map(unary<LonLat, EasNor>(mapViewCoordinateFromLonLat)))
      .andThen(geofenceGenerationSettingsApplicator)
      .map((cs) => cs.map(unary<EasNor, LonLat>(lonLatFromMapViewCoordinate)))
);

/**
 * Selector that calculates the maximal horizontal distance that any UAV will
 * reach during the mission. (Measured from its starting position.)
 */
export const getMaximumHorizontalDistanceForCurrentMissionType: AppSelector<
  number | undefined
> = (state) => {
  const missionType = getMissionType(state);
  switch (missionType) {
    case MissionType.SHOW:
      return getMaximumHorizontalDistanceFromTakeoffPositionInTrajectories(
        state
      );
    case MissionType.WAYPOINT:
      return getMaximumHorizontalDistanceFromHomePositionInWaypointMission(
        state
      );

    default:
      console.warn(
        `Could not get maximum horizontal distance for mission type: '${missionType}'`
      );
  }
};

/**
 * Selector that calculates the maximal height that any UAV will reach during
 * the mission.
 */
export const getMaximumHeightForCurrentMissionType: AppSelector<
  number | undefined
> = (state) => {
  const missionType = getMissionType(state);
  switch (missionType) {
    case MissionType.SHOW:
      return getMaximumHeightInTrajectories(state);
    case MissionType.WAYPOINT:
      return getMaximumHeightOfWaypoints(state);

    default:
      console.warn(
        `Could not get maximum height for mission type: '${missionType}'`
      );
  }
};

/**
 * Returns the maximum distance of any geofence vertex from any home position.
 */
export const getMaximumDistanceBetweenHomePositionsAndGeofence: AppSelector<
  number | undefined
> = createSelector(
  getGPSBasedHomePositionsInMission,
  getGeofencePolygonInWorldCoordinates,
  (homePositions, geofencePolygon) => {
    if (!geofencePolygon) {
      return;
    }

    const homePoints = rejectNullish(homePositions).map(({ lon, lat }) =>
      TurfHelpers.point([lon, lat])
    );
    const geofencePoints = geofencePolygon.map(([lon, lat]) =>
      TurfHelpers.point([lon, lat])
    );
    const distances = homePoints.flatMap((hp) =>
      geofencePoints.map((gp) => turfDistanceInMeters(hp, gp))
    );

    return max(distances);
  }
);

/**
 * Returns the automatically calculated distance limit by adding the declared
 * horizontal safety margin to the distance of the mission's farthest point.
 */
export const getProposedDistanceLimit: AppSelector<number | undefined> = (
  state
) => {
  const margin = getGeofenceSettings(state).horizontalMargin;
  const maxDistance = getMaximumHorizontalDistanceForCurrentMissionType(state);
  const maxGeofence = getMaximumDistanceBetweenHomePositionsAndGeofence(state);
  const missionType = getMissionType(state);

  switch (missionType) {
    case MissionType.SHOW:
      return proposeDistanceLimit(maxDistance, margin);
    case MissionType.WAYPOINT:
      return maxGeofence === undefined
        ? proposeDistanceLimit(maxDistance, margin)
        : proposeDistanceLimit(maxGeofence, 0);

    default:
      console.warn(
        `Could not get distance limit proposal for mission type: '${missionType}'`
      );
  }
};

/**
 * Returns the automatically calculated height limit by adding the declared
 * vertical safety margin to the mission's highest point.
 */
export const getProposedHeightLimit: AppSelector<number> = (state) => {
  const maxHeight = getMaximumHeightForCurrentMissionType(state);
  const margin = getGeofenceSettings(state).verticalMargin;
  return proposeHeightLimit(maxHeight, margin);
};

/**
 * Returns the user-defined distance limit, which should be above the
 * automatically proposed distance limit.
 */
export const getUserDefinedDistanceLimit: AppSelector<number | undefined> = (
  state
) => {
  // TODO(ntamas): this should be configurable by the user and not simply set
  // based on the proposal
  return getProposedDistanceLimit(state);
};

/**
 * Returns the user-defined height limit, which should be above the
 * automatically
 * proposed height limit.
 */
export const getUserDefinedHeightLimit: AppSelector<number> = (state) => {
  // TODO(ntamas): this should be configurable by the user and not simply set
  // based on the proposal
  return getProposedHeightLimit(state);
};
