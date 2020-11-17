import intersection from 'lodash-es/intersection';
import isNil from 'lodash-es/isNil';
import range from 'lodash-es/range';
import reject from 'lodash-es/reject';
import { createSelector } from '@reduxjs/toolkit';

import { getSelectedUAVIds } from '~/selectors/selection';
import { Status } from '~/components/semantics';

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
 * Returns a list of all the UAV IDs that participate in the mission, without
 * the null entries, sorted in ascending order.
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
 * Returns whether there is at least one non-empty mapping slot in the mapping.
 */
export const hasNonemptyMappingSlot = createSelector(
  getMissionMapping,
  (mapping) => (mapping ? !mapping.every(isNil) : false)
);

/**
 * Returns whether the current UAV selection includes _exactly_ those UAVs that
 * participate in the mission, and nothing else.
 */
export const areAllUAVsInMissionSelectedAndNothingElse = createSelector(
  getSelectedUAVIds,
  getUAVIdsParticipatingInMission,
  (selectedUAVIds, missionUAVIds) => {
    if (selectedUAVIds.length !== missionUAVIds.length) {
      return false;
    }

    return (
      intersection(selectedUAVIds, missionUAVIds).length ===
      selectedUAVIds.length
    );
  }
);

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
 * Returns whether the current selection has at least one drone that appears in
 * the mission mapping.
 */
export const selectionIntersectsMapping = createSelector(
  getMissionMapping,
  getSelectedUAVIds,
  (mapping, selectedUAVIds) => {
    for (const uavId of selectedUAVIds) {
      if (uavId !== undefined && mapping.includes(uavId)) {
        return true;
      }
    }

    return false;
  }
);

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
