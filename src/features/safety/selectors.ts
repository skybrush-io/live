import {
  getMaximumDistanceBetweenHomePositionsAndGeofence,
  getMaximumHeightOfWaypoints,
  getMaximumHorizontalDistanceFromHomePositionInWaypointMission,
  getMissionType,
} from '~/features/mission/selectors';
import {
  getMaximumHeightInTrajectories,
  getMaximumHorizontalDistanceFromTakeoffPositionInTrajectories,
} from '~/features/show/selectors';
import { MissionType } from '~/model/missions';
import { type AppSelector } from '~/store/reducers';
import { rejectNullish } from '~/utils/arrays';

import { type SafetyDialogTab } from './constants';
import { type SafetySliceState } from './slice';
import { proposeDistanceLimit, proposeHeightLimit } from './utils';

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
 * Returns the automatically calculated distance limit by adding the declared
 * horizontal safety margin to the distance of the mission's farthest point.
 */
export const getProposedDistanceLimit: AppSelector<number> = (state) => {
  const maxDistance = getMaximumHorizontalDistanceForCurrentMissionType(state);
  const maxGeofence = getMaximumDistanceBetweenHomePositionsAndGeofence(state);
  const margin = getGeofenceSettings(state).horizontalMargin;
  return proposeDistanceLimit(
    Math.max(...rejectNullish([maxDistance, maxGeofence])),
    margin
  );
};

/**
 * Returns the automatically calculated height limit by adding the declared
 * vertical safety margin to the mission's highest point.
 */
export const getProposedHeightLimit: AppSelector<number> = (state) => {
  const maxHeight = getMaximumHeightForCurrentMissionType(state);
  const margin = getGeofenceSettings(state).verticalMargin;
  return proposeHeightLimit(Math.max(...rejectNullish([maxHeight])), margin);
};

/**
 * Returns the user-defined distance limit, which should be above the
 * automatically proposed distance limit.
 */
export const getUserDefinedDistanceLimit: AppSelector<number> = (state) => {
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
