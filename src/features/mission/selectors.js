import isNil from 'lodash-es/isNil';
import max from 'lodash-es/max';
import min from 'lodash-es/min';
import range from 'lodash-es/range';
import reject from 'lodash-es/reject';
import { createSelector } from '@reduxjs/toolkit';
import turfContains from '@turf/boolean-contains';
import turfDistance from '@turf/distance';
import * as TurfHelpers from '@turf/helpers';

import {
  GeofenceAction,
  isValidGeofenceAction,
} from '~/features/geofence/model';
import { getFeaturesByIds } from '~/features/map-features/selectors';
import {
  globalIdToMissionItemId,
  globalIdToMissionSlotId,
} from '~/model/identifiers';
import {
  getCoordinateFromMissionItem,
  MissionItemType,
  MissionType,
} from '~/model/missions';
import { selectionForSubset } from '~/selectors/selection';
import { selectOrdered } from '~/utils/collections';
import { mapViewCoordinateFromLonLat } from '~/utils/geography';
import { convexHull, createGeometryFromPoints } from '~/utils/math';
import { EMPTY_ARRAY } from '~/utils/redux';

/**
 * Key selector function for cached selectors that cache things by mission
 * index.
 */
export const selectMissionIndex = (_state, missionIndex) => missionIndex;

/**
 * Returns the type of the current mission.
 */
export const getMissionType = (state) =>
  state.mission.type || MissionType.UNKNOWN;

/**
 * Returns the IDs of the items in the current waypoint-based mission, in the
 * order they should appear on the UI.
 */
export const getMissionItemIds = (state) => state.mission.items.order;

/**
 * Selector that calculates and caches the list of selected mission item IDs from
 * the state object.
 */
export const getSelectedMissionItemIds = selectionForSubset(
  globalIdToMissionItemId
);

/**
 * Returns a mapping from IDs to the corresponding mission items.
 */
export const getMissionItemsById = (state) => state.mission.items.byId;

/**
 * Returns a single mission item by its ID.
 */
export const getMissionItemById = (state, itemId) =>
  state.mission.items.byId[itemId];

/**
 * Returns the items in the current waypoint-based mission.
 */
export const getMissionItemsInOrder = createSelector(
  (state) => state.mission.items,
  selectOrdered
);

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
 * Gets the polygon that is to be used as a geofence.
 */
export const getGeofencePolygon = createSelector(
  getGeofencePolygonId,
  getFeaturesByIds,
  (geofencePolygonId, featuresById) => featuresById[geofencePolygonId]
);

/**
 * Gets the coordinates of the polygon that is to be used as a geofence, in
 * world coordinates, or undefined if no geofence polygon is defined.
 */
export const getGeofencePolygonInWorldCoordinates = createSelector(
  getGeofencePolygon,
  (geofencePolygon) => geofencePolygon?.points
);

/**
 * Returns whether a geofence is currently set by the user (either automatically)
 * or manually.
 */
export const hasActiveGeofencePolygon = createSelector(
  getGeofencePolygonId,
  getFeaturesByIds,
  (geofencePolygonId, featuresById) =>
    geofencePolygonId !== undefined &&
    featuresById[geofencePolygonId] !== undefined
);

export const getItemIndexRangeForSelectedMissionItems = createSelector(
  getMissionItemIds,
  getSelectedMissionItemIds,
  (allIds, selectedIds) => {
    const indices = selectedIds.map((id) => allIds.indexOf(id));
    const minIndex = min(indices);
    const maxIndex = max(indices);
    return [minIndex, maxIndex];
  }
);

/**
 * Returns whether the currently selected mission items form a single,
 * uninterrupted chunk in the list of mission items.
 */
export const areSelectedMissionItemsInOneChunk = createSelector(
  getItemIndexRangeForSelectedMissionItems,
  getSelectedMissionItemIds,
  (indexRange, selectedIds) => {
    const [minIndex, maxIndex] = indexRange;
    return minIndex >= 0 && maxIndex === minIndex + selectedIds.length - 1;
  }
);

export const createCanMoveSelectedMissionItemsByDeltaSelector = (delta) =>
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
export const canMoveSelectedMissionItemsUp =
  createCanMoveSelectedMissionItemsByDeltaSelector(-1);

/**
 * Returns whether the currently selected mission items can be moved downwards
 * by one slot.
 */
export const canMoveSelectedMissionItemsDown =
  createCanMoveSelectedMissionItemsByDeltaSelector(1);

/**
 * Returns a selector that converts the current list of mission items to a
 * list of objects containing the GPS coordinates where the items should
 * appear on the map, along with the original items themselves. This is used
 * by map views to show the mission items.
 *
 * The returned array will contain objects with the following keys:
 *
 * - id: maps to the ID of the mission item
 * - coordinate: maps to a latitude-longitude pair of the mission item (as an
 *   array of length 2)
 * - item: maps to the item itself
 * - index: the index of the item in the list of mission items
 *
 * Mission items for which no coordinate belongs are not returned.
 */
export const getMissionItemsWithCoordinatesInOrder = createSelector(
  getMissionItemsInOrder,
  (items) => {
    const result = [];
    let index = 0;

    for (const item of items) {
      const coordinate = getCoordinateFromMissionItem(item);
      if (coordinate) {
        result.push({ id: item.id, item, coordinate, index });
      }

      index++;
    }

    return result;
  }
);

/**
 * Returns the coordinates of the convex hull of the currently loaded mission
 * in the coordinate system of the map view.
 */
export const getConvexHullOfHomePositionsAndMissionItemsInWorldCoordinates =
  createSelector(
    getGPSBasedHomePositionsInMission,
    getMissionItemsWithCoordinatesInOrder,
    (homePositions, missionItemsWithCoorinates) =>
      convexHull([
        ...homePositions.map((hp) => [hp.lon, hp.lat]),
        ...missionItemsWithCoorinates.map((miwc) => [
          miwc.coordinate.lon,
          miwc.coordinate.lat,
        ]),
      ])
  );

/**
 * Returns the coordinates of the convex hull of the currently loaded mission
 * in the coordinate system of the map view.
 */
export const getConvexHullOfHomePositionsAndMissionItemsInMapViewCoordinates =
  createSelector(
    getConvexHullOfHomePositionsAndMissionItemsInWorldCoordinates,
    (convexHullOfHomePositionsAndMissionItemsInWorldCoordinates) =>
      convexHullOfHomePositionsAndMissionItemsInWorldCoordinates.map(
        (worldCoordinate) => mapViewCoordinateFromLonLat(worldCoordinate)
      )
  );

/**
 * Returns whether the convex hull of the waypoint mission (home positions and
 * mission items) is fully contained inside the geofence polygon.
 */
export const isWaypointMissionConvexHullInsideGeofence = createSelector(
  getConvexHullOfHomePositionsAndMissionItemsInWorldCoordinates,
  getGeofencePolygonInWorldCoordinates,
  (convexHull, geofence) => {
    if (
      Array.isArray(geofence) &&
      geofence.length > 0 &&
      Array.isArray(convexHull) &&
      convexHull.length > 0
    ) {
      geofence = createGeometryFromPoints(geofence);
      convexHull = createGeometryFromPoints(convexHull);
      return turfContains(geofence, convexHull);
    }

    return false;
  }
);

/**
 * Selector that returns the payload of the mission item upload job.
 */
export const getMissionItemUploadJobPayload = (state) => {
  return {
    version: 1,
    items: getMissionItemsInOrder(state),
  };
};

/**
 * Selector that returns whether the mission planner dialog is open.
 */
export const isMissionPlannerDialogOpen = (state) =>
  state.mission.plannerDialog.open;

/**
 * Selector that returns estimates about the mission.
 *
 * @returns {Object} estimates
 * @property {number} distance - the length of the planned trajectory in meters
 * @property {number} duration - the expected duration of the mission in seconds
 */
export const getMissionEstimates = createSelector(
  getMissionItemsInOrder,
  (items) => {
    // eslint-disable-next-line unicorn/no-array-reduce
    const { distance, duration } = items.reduce(
      (state, { type, parameters }) => {
        const { _altitude, _position, _speed, duration, distance } = state;
        return {
          ...state,
          ...(() => {
            switch (type) {
              case MissionItemType.TAKEOFF: {
                return {
                  _altitude: parameters.alt.value,
                };
              }

              case MissionItemType.CHANGE_ALTITUDE: {
                if (!_altitude) {
                  return {
                    _altitude: parameters.alt.value,
                  };
                }

                const delta = Math.abs(_altitude - parameters.alt.value);

                return {
                  _altitude: parameters.alt.value,
                  distance: distance + delta,
                  duration: duration + delta / _speed.Z,
                };
              }

              case MissionItemType.CHANGE_SPEED: {
                return {
                  _speed: {
                    XY: parameters.velocityXY,
                    Z: parameters.velocityZ,
                  },
                };
              }

              case MissionItemType.GO_TO: {
                const target = TurfHelpers.point([
                  parameters.lon,
                  parameters.lat,
                ]);

                if (!_position) {
                  return {
                    _position: target,
                  };
                }

                const length = turfDistance(_position, target) * 1000;

                return {
                  _position: target,
                  distance: distance + length,
                  duration: duration + length / _speed.XY,
                };
              }

              default:
              // The remaining mission item types are currently ignored.
            }
          })(),
        };
      },
      { distance: 0, duration: 0 }
    );
    return { distance, duration };
  }
);
