import isNil from 'lodash-es/isNil';
import range from 'lodash-es/range';
import reject from 'lodash-es/reject';
import { createSelector } from '@reduxjs/toolkit';

import { Status } from '~/components/semantics';
import {
  GeofenceAction,
  isValidGeofenceAction,
} from '~/features/geofence/model';
import { globalIdToMissionSlotId } from '~/model/identifiers';
import { selectionForSubset } from '~/selectors/selection';
import { EMPTY_ARRAY } from '~/utils/redux';

/**
 * Key selector function for cached selectors that cache things by mission
 * index.
 */
export const selectMissionIndex = (_state, missionIndex) => missionIndex;

/**
 * Returns the current list of home positions in the mission.
 *
 * @param  {Object}  state  the state of the application
 */
export const getGPSBasedHomePositionsInMission = (state) =>
  state.mission.homePositions;

/**
 * Returns the current list of landing positions in the mission.
 *
 * @param  {Object}  state  the state of the application
 */
export const getGPSBasedLandingPositionsInMission = (state) =>
  state.mission.landingPositions;

/**
 * Returns the current list of takeoff headings in the mission.
 */
export const getTakeoffHeadingsInMission = (state) =>
  state.mission.takeoffHeadings;

/**
 * Returns the current mapping from mission-specific slots to the corresponding
 * UAV identifiers.
 *
 * @param  {Object}  state  the state of the application
 */
export const getMissionMapping = (state) => state.mission.mapping;

/**
 * Returns the contents of a file that would encode the current mission mapping
 * as a string.
 *
 * This is not a pure selector as it encodes the current time in the file.
 */
export const getMissionMappingFileContents = (state) => {
  const mapping = getMissionMapping(state);
  const length = mapping && Array.isArray(mapping) ? mapping.length : 0;
  const lines = [];

  lines.push(
    `# Mapping file generated at ${new Date().toISOString()}`,
    '#',
    '# showID droneID'
  );

  for (let i = 0; i < length; i++) {
    lines.push(`${i + 1}${isNil(mapping[i]) ? '' : ` ${String(mapping[i])}`}`);
  }

  lines.push('');
  return lines.join('\n');
};

/**
 * Returns a list containing the indices of all the empty mapping slots (i.e.
 * slots that have no assigned drone yet).
 */
export const getEmptyMappingSlotIndices = createSelector(
  getMissionMapping,
  (mapping) =>
    mapping
      ? range(mapping.length).filter((index) => isNil(mapping[index]))
      : []
);

/**
 * Returns the index of the mapping slot being edited.
 */
export const getIndexOfMappingSlotBeingEdited = (state) =>
  state.mission.mappingEditor.indexBeingEdited;

/**
 * Returns the reverse mapping from UAV IDs to the corresponding mission IDs.
 */
export const getReverseMissionMapping = createSelector(
  getMissionMapping,
  (mapping) =>
    // eslint-disable-next-line unicorn/no-array-reduce
    mapping.reduce((acc, uavId, index) => {
      if (!isNil(uavId)) {
        acc[uavId] = index;
      }

      return acc;
    }, {})
);

/**
 * Returns the ID of the UAV that is currently at the mapping slot being edited.
 */
export const getUAVIdForMappingSlotBeingEdited = createSelector(
  getMissionMapping,
  getIndexOfMappingSlotBeingEdited,
  (mapping, index) => (index >= 0 ? mapping[index] : undefined)
);

/**
 * Selector that calculates and caches the list of selected mission indices from
 * the state object.
 */
export const getSelectedMissionIndices = selectionForSubset(
  globalIdToMissionSlotId
);

/**
 * Selector that calculates the number of selected mission indices.
 */
export const getNumberOfSelectedMissionIndices = (state) => {
  const selection = getSelectedMissionIndices(state);
  return Array.isArray(selection) ? selection.length : 0;
};

/**
 * Selector that returns at most five selected mission indices for sake of
 * displaying their trajectories.
 */
export const getSelectedMissionIndicesForTrajectoryDisplay = (state) =>
  getNumberOfSelectedMissionIndices(state) <= 5
    ? getSelectedMissionIndices(state)
    : EMPTY_ARRAY;

/**
 * Returns a list of all the UAV IDs that participate in the mission, without
 * the null entries, sorted in ascending order by the UAV IDs.
 *
 * Note that this also includes the IDs of UAVs that are currently not seen
 * by the server but are nevertheless in the mapping.
 */
export const getUAVIdsParticipatingInMission = createSelector(
  getMissionMapping,
  (mapping) => {
    const result = reject(mapping, isNil);
    result.sort();
    return result;
  }
);

/**
 * Returns a list of all the UAV IDs that participate in the mission, without
 * the null entries, sorted in ascending order by their mission indices.
 * (In other words, UAV IDs that correspond to earlier slots in the mission
 * mapping are returned first).
 *
 * Note that this also includes the IDs of UAVs that are currently not seen
 * by the server but are nevertheless in the mapping.
 */
export const getUAVIdsParticipatingInMissionSortedByMissionIndex = (state) =>
  reject(getMissionMapping(state), isNil);

/**
 * Returns whether there is at least one non-empty mapping slot in the mapping.
 */
export const hasNonemptyMappingSlot = createSelector(
  getMissionMapping,
  (mapping) => (mapping ? !mapping.every(isNil) : false)
);

/**
 * Returns the index of the communication channel that is currently used to
 * communicate with the UAVs.
 */
export const getPreferredCommunicationChannelIndex = (state) =>
  state.mission.preferredChannelIndex;

/**
 * Returns whether we are broadcasting commands to the drones in the current
 * show from the large flight control panel.
 */
export const areFlightCommandsBroadcast = (state) =>
  state.mission.commandsAreBroadcast;

/**
 * Returns whether it currently makes sense to enable the "augment mapping from
 * current drone positions automatically" button. This action makes sense only
 * if there is at least one spare drone, at least one empty slot in the mapping
 * and the home coordinates are set.
 *
 * Note that right now we don't check whether there are spare drones as we would
 * need to reach out to another slice of the state store for that. This can be
 * added later.
 */
export const canAugmentMappingAutomaticallyFromSpareDrones = createSelector(
  getEmptyMappingSlotIndices,
  getGPSBasedHomePositionsInMission,
  (emptySlots, homePositions) =>
    emptySlots.length > 0 && homePositions.some((position) => !isNil(position))
);

/**
 * Returns whether the current mapping is editable at the moment.
 */
export const isMappingEditable = (state) => state.mission.mappingEditor.enabled;

/**
 * Gets the action to perform when the geofence is breached.
 */
export const getGeofenceAction = (state) =>
  state.mission.geofenceAction || GeofenceAction.KEEP_CURRENT;

/**
 * Gets the action to perform when the geofence is breached, with validation.
 *
 * Throws an error if the geofence action in the state object is not valid.
 */
export function getGeofenceActionWithValidation(state) {
  const action = getGeofenceAction(state);
  if (!isValidGeofenceAction(action)) {
    throw new Error('Invalid geofence action: ' + String(action));
  }

  return action;
}

/**
 * Gets the ID of the polygon that is to be used as a geofence.
 */
export const getGeofencePolygonId = (state) => state.mission.geofencePolygonId;

/**
 * Gets the coordinates of the polygon that is to be used as a geofence, in
 * world coordinates, or undefined if no geofence polygon is defined.
 */
export const getGeofencePolygonInWorldCoordinates = createSelector(
  getGeofencePolygonId,
  (state) => state.features.byId,
  (geofencePolygonId, featuresById) => featuresById[geofencePolygonId]?.points
);

/**
 * Returns whether a geofence is currently set by the user (either automatically)
 * or manually.
 */
export const hasActiveGeofencePolygon = createSelector(
  getGeofencePolygonId,
  (state) => state.features.byId,
  (geofencePolygonId, featuresById) =>
    geofencePolygonId !== undefined &&
    featuresById[geofencePolygonId] !== undefined
);

export const getGeofenceStatus = createSelector(
  hasActiveGeofencePolygon,
  getGeofencePolygonId,
  (state) => state.features.byId,
  (hasActiveGeofencePolygon, geofencePolygonId, featuresById) => {
    return !hasActiveGeofencePolygon
      ? Status.OFF
      : featuresById[geofencePolygonId].owner === 'show'
      ? Status.SUCCESS
      : Status.WARNING;
  }
);
