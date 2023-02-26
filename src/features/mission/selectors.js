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
import {
  AltitudeReference,
  mapViewCoordinateFromLonLat,
} from '~/utils/geography';
import {
  convexHull,
  createGeometryFromPoints,
  estimatePathDuration,
} from '~/utils/math';
import { EMPTY_ARRAY } from '~/utils/redux';

import { transformMissionItemBeforeUpload } from './upload';

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
 * Returns whether the mission editor panel should follow the active item.
 */
export const shouldMissionEditorPanelFollowScroll = (state) =>
  state.mission.editorPanel.followScroll;

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
        ...homePositions.filter(Boolean).map((hp) => [hp.lon, hp.lat]),
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
  const items = getMissionItemsInOrder(state).map((item) =>
    transformMissionItemBeforeUpload(item, state)
  );
  return { version: 1, items };
};

/**
 * Selector that returns whether the mission planner dialog is open.
 */
export const isMissionPlannerDialogOpen = (state) =>
  state.mission.plannerDialog.open;

/**
 * Selector that returns the mapping to be used when setting parameters for the
 * mission planner from the context.
 */
export const getMissionPlannerDialogContextParameters = (state) =>
  // Reconstruct the Map representation from the stored object.
  new Map(Object.entries(state.mission.plannerDialog.parameters.fromContext));

/**
 * Selector that returns the parameters for the mission planner set by the user.
 */
export const getMissionPlannerDialogUserParameters = (state) =>
  state.mission.plannerDialog.parameters.fromUser;

/**
 * Selector that returns the mission type currently selected for planning.
 */
export const getMissionPlannerDialogSelectedType = (state) =>
  state.mission.plannerDialog.selectedType;

/**
 * Selector that returns whether the mission planner dialog should apply an
 * automatically generated geofence.
 */
export const shouldMissionPlannerDialogApplyGeofence = (state) =>
  state.mission.plannerDialog.applyGeofence;

/**
 * Selector that returns the items of the mission wrapped together with distance
 * and velocity information where movement is involved.
 *
 * @returns {Array}
 */
export const getMissionItemsInOrderAsSegments = createSelector(
  getGPSBasedHomePositionsInMission,
  getMissionItemsInOrder,
  ([homePosition], items) => {
    const home = homePosition && {
      XY: TurfHelpers.point([homePosition.lon, homePosition.lat]),
      Z: {
        [AltitudeReference.HOME]: homePosition.agl,
        [AltitudeReference.MSL]: homePosition.amsl,
      },
    };
    try {
      // eslint-disable-next-line unicorn/no-array-reduce
      return items.reduce(
        (state, item) => {
          const { type, parameters } = item;
          const { _altitudeReference, _position, _velocity, segments } = state;
          return {
            // Take the previous state and update it based on the following
            ...state,
            // Add the current item as a segment without movement by default
            segments: [...segments, { item }],
            // Overwrite any returned mission item type specific properties
            ...(() => {
              const moveToXY = (target) => {
                // We don't yet have position information to measure from
                if (!_position.XY) {
                  return { _position: { ..._position, XY: target } };
                }

                // Multiply by `1000` to get the result in meters
                // (By default `turfDistance` returns kilometers)
                const length = turfDistance(_position.XY, target) * 1000;

                return {
                  _position: { ..._position, XY: target },
                  segments: [
                    ...segments,
                    { item, distance: length, velocity: _velocity.XY },
                  ],
                };
              };

              const moveToZ = ({ value: target, reference }) => {
                if (
                  // We don't yet have altitude information to measure from
                  !_position.Z ||
                  // Or our previous point is given with a different reference
                  // TODO: Maybe mixed references should raise a warning
                  (_altitudeReference && _altitudeReference !== reference)
                ) {
                  return {
                    _altitudeReference: reference,
                    _position: { ..._position, Z: { [reference]: target } },
                  };
                }

                const height = Math.abs(_position.Z[reference] - target);

                return {
                  _altitudeReference: reference,
                  _position: { ..._position, Z: { [reference]: target } },
                  segments: [
                    ...segments,
                    { item, distance: height, velocity: _velocity.Z },
                  ],
                };
              };

              // TODO: According to the server code some mission item types
              // can have optional parameters for altitude and velocities.
              // We should include that information when it is available.
              switch (type) {
                /* =================== Changing velocity =================== */

                case MissionItemType.CHANGE_SPEED: {
                  return {
                    _velocity: {
                      XY: parameters.velocityXY,
                      Z: parameters.velocityZ,
                    },
                  };
                }

                /* =================== Changing altitude =================== */

                case MissionItemType.TAKEOFF: {
                  return moveToZ(parameters.alt);
                }

                case MissionItemType.CHANGE_ALTITUDE: {
                  return moveToZ(parameters.alt);
                }

                case MissionItemType.LAND: {
                  return home
                    ? moveToZ({
                        value: home.Z[_altitudeReference],
                        reference: _altitudeReference,
                      })
                    : {};
                }

                /* =================== Changing position =================== */

                case MissionItemType.GO_TO: {
                  const waypoint = TurfHelpers.point([
                    parameters.lon,
                    parameters.lat,
                  ]);

                  return moveToXY(waypoint);
                }

                case MissionItemType.RETURN_TO_HOME: {
                  return home ? moveToXY(home.XY) : {};
                }

                default:
                // The remaining mission item types do not contain movement
              }
            })(),
          };
        },
        {
          // The first item to have altitude information can choose which
          // reference type to use
          _altitudeReference: undefined,
          _position: { XY: home?.XY, Z: home?.Z },
          _velocity: { XY: 0, Z: 0 },
          segments: [],
        }
      ).segments;
    } catch (error) {
      return { error: `Route segment calculation error: ${error}` };
    }
  }
);

/**
 * Selector that returns estimates about the mission.
 *
 * @returns {Object} estimates
 * @property {number} distance - the length of the planned trajectory in meters
 * @property {number} duration - the expected duration of the mission in seconds
 */
export const getMissionEstimates = createSelector(
  getMissionItemsInOrderAsSegments,
  (segments) => {
    return (
      segments
        .filter((s) => Boolean(s.distance))
        // eslint-disable-next-line unicorn/no-array-reduce
        .reduce(
          ({ distance, duration }, s) => ({
            distance: distance + s.distance,
            duration: duration + estimatePathDuration(s.distance, s.velocity),
          }),
          { distance: 0, duration: 0 }
        )
    );
  }
);

/**
 * Selector that returns the id of the mission item that's currently being
 * executed.
 */
export const getCurrentMissionItemId = (state) =>
  state.mission.progress.currentItemId;

/**
 * Selector that returns the index of the mission item that's currently being
 * executed.
 */
export const getCurrentMissionItemIndex = createSelector(
  getMissionItemIds,
  getCurrentMissionItemId,
  (ids, currentId) => ids.indexOf(currentId)
);

/**
 * Selector that returns the progress ratio of the mission item that's
 * currently being executed.
 */
export const getCurrentMissionItemRatio = (state) =>
  state.mission.progress.currentItemRatio;

/**
 * Selector that returns whether mission progress information has been received.
 */
export const isProgressInformationAvailable = (state) =>
  state.mission.progress.currentItemId !== undefined;

/**
 * Selector that returns the starting ratio of a partial mission.
 */
export const getStartRatioOfPartialMission = createSelector(
  getMissionItemsInOrder,
  (items) =>
    Number(
      items.find(
        (mi) => mi.type === 'marker' && mi.parameters.marker === 'start'
      )?.parameters?.ratio ?? 0
    )
);

/**
 * Selector that returns the ending ratio of a partial mission.
 */
export const getEndRatioOfPartialMission = createSelector(
  getMissionItemsInOrder,
  (items) =>
    Number(
      items.find((mi) => mi.type === 'marker' && mi.parameters.marker === 'end')
        ?.parameters?.ratio ?? 1
    )
);

/**
 * Selector that returns the completion ratio of the net mission.
 *
 * @returns {number} the ratio of the done and total lengths of the net mission
 */
export const getNetMissionCompletionRatio = createSelector(
  getMissionItemsInOrderAsSegments,
  getCurrentMissionItemId,
  getCurrentMissionItemRatio,
  (segments, currentId, currentRatio) => {
    // eslint-disable-next-line unicorn/no-array-reduce
    const { doneDistance, totalDistance } = segments.reduce(
      (state, { item: { id, type, parameters }, distance = 0 }) => {
        const { _isDone, _isNet, doneDistance, totalDistance } = state;
        const isCurrent = id === currentId;

        // prettier-ignore
        return {
          // Take the previous state and update it based on the following
          ...state,
          // Segments are only considered done before the currently active item
          _isDone: _isDone && !isCurrent,
          // If the current item is a marker check whether it marks the start
          // or the end of the useful (net) part of the mission
          ...(
            type === MissionItemType.MARKER && (
              parameters.marker === 'start' ?  { _isNet: true  } :
              parameters.marker === 'end'   ?  { _isNet: false } :
              {}
            )
          ),
          // If we are currently in the useful (net) part of the mission,
          // accumulate the done and total distance appropriately
          ...(
            _isNet && {
              doneDistance: doneDistance + (
                // The item is currently active, apply the ratio to its distance
                isCurrent ? distance * currentRatio :
                // The item is done, count the entire distance
                _isDone ? distance :
                // The item is not even started
                0
              ),
              totalDistance: totalDistance + distance,
            }
          ),
        };
      },
      {
        // If there is an active item, we start the reduction by considering the
        // items done until we encounter the one that's currently in progress
        _isDone: Boolean(currentId),
        _isNet: false,
        doneDistance: 0,
        totalDistance: 0,
      }
    );

    return totalDistance > 0 ? doneDistance / totalDistance : 0;
  }
);

/**
 * Selector that returns the global completion ratio of a mission calculated
 * from the local bounds and the local ratio.
 */
export const getGlobalMissionCompletionRatio = createSelector(
  getStartRatioOfPartialMission,
  getEndRatioOfPartialMission,
  getNetMissionCompletionRatio,
  (start, end, localRatio) => start + (end - start) * localRatio
);

/**
 * Selector that returns whether there is a partially completed mission that can
 * be resumed from an interruption point.
 */
export const isMissionPartiallyCompleted = createSelector(
  getGlobalMissionCompletionRatio,
  (ratio) => ratio > 0 && ratio < 1
);
