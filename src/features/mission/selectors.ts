import { produce } from 'immer';
import isNil from 'lodash-es/isNil';
import max from 'lodash-es/max';
import range from 'lodash-es/range';
import { createSelector } from '@reduxjs/toolkit';
import turfContains from '@turf/boolean-contains';
import * as TurfHelpers from '@turf/helpers';

import {
  getFeaturesById,
  getFeaturesInOrder,
} from '~/features/map-features/selectors';
import { type FeatureWithProperties } from '~/features/map-features/types';
import { GeofenceAction, isValidGeofenceAction } from '~/features/safety/model';
import {
  type Altitude,
  AltitudeReference,
  type GPSPosition,
} from '~/model/geography';
import {
  globalIdToMissionItemId,
  globalIdToMissionSlotId,
} from '~/model/identifiers';
import {
  getAltitudeFromMissionItem,
  getAreaFromMissionItem,
  getCoordinateFromMissionItem,
  MarkerType,
  type MissionIndex,
  type MissionItem,
  MissionItemType,
  MissionType,
} from '~/model/missions';
import type UAV from '~/model/uav';
import { selectionForSubset } from '~/selectors/selection';
import { type AppSelector } from '~/store/reducers';
import { rejectNullish } from '~/utils/arrays';
import {
  type Collection,
  type Identifier,
  selectOrdered,
} from '~/utils/collections';
import {
  mapViewCoordinateFromLonLat,
  turfDistanceInMeters,
} from '~/utils/geography';
import {
  convexHull,
  type Coordinate2D,
  createGeometryFromPoints,
  estimatePathDuration,
} from '~/utils/math';
import { EMPTY_ARRAY } from '~/utils/redux';
import { type Nullable } from '~/utils/types';

import { type MissionSliceState } from './slice';

/**
 * Key selector function for cached selectors that cache things by mission
 * index.
 */
export const selectMissionIndex: AppSelector<number, [number]> = (
  _state,
  missionIndex
) => missionIndex;

/**
 * Returns the type of the current mission.
 */
export const getMissionType: AppSelector<MissionType> = (state) =>
  state.mission.type ?? MissionType.UNKNOWN;

/**
 * Returns the name of the current mission, if given.
 */
export const getMissionName: AppSelector<string | undefined> = (state) =>
  state.mission.name;

/**
 * Selector that returns a list of mission item IDs with a mapping from these
 * IDs to their stored representations.
 */
export const getMissionItemsAsCollection: AppSelector<
  Collection<MissionItem>
> = (state) => state.mission.items;

/**
 * Returns the IDs of the items in the current waypoint-based mission, in the
 * order they should appear on the UI.
 */
export const getMissionItemIds: AppSelector<Identifier[]> = (state) =>
  state.mission.items.order;

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
export const getMissionItemsById: AppSelector<
  Record<Identifier, MissionItem>
> = (state) => state.mission.items.byId;

/**
 * Returns a single mission item by its ID.
 */
export const getMissionItemById: AppSelector<
  MissionItem | undefined,
  [Identifier]
> = (state, itemId) => state.mission.items.byId[itemId];

/**
 * Returns the items in the current waypoint-based mission.
 */
export const getMissionItemsInOrder: AppSelector<MissionItem[]> =
  createSelector(getMissionItemsAsCollection, selectOrdered);

/**
 * Returns the items in the current waypoint-based mission annotated with their
 * order based indices.
 */
export const getMissionItemsInOrderWithIndices: AppSelector<
  Array<{ index: number; item: MissionItem }>
> = createSelector(getMissionItemsInOrder, (missionItems) =>
  missionItems.map((item, index) => ({ index, item }))
);

/**
 * Returns the list of items in the current waypoint-based mission that have the
 * given type, annotated with their order based indices.
 *
 * TODO: Improve typing to return a list specific to the given MissionItemType.
 */
export const getMissionItemsOfTypeWithIndices: AppSelector<
  Array<{ index: number; item: MissionItem }>,
  [MissionItemType]
> = createSelector(
  getMissionItemsInOrderWithIndices,
  ((_state, missionItemType) => missionItemType) satisfies AppSelector<
    MissionItemType,
    [MissionItemType]
  >,
  (itemsWithIndices, missionItemType) =>
    itemsWithIndices.filter(({ item: { type } }) => type === missionItemType)
);

/**
 * Returns the current list of home positions in the mission.
 */
export const getGPSBasedHomePositionsInMission: AppSelector<
  MissionSliceState['homePositions']
> = (state) => state.mission.homePositions;

/**
 * Returns the current list of landing positions in the mission.
 */
export const getGPSBasedLandingPositionsInMission: AppSelector<
  MissionSliceState['landingPositions']
> = (state) => state.mission.landingPositions;

/**
 * Returns the current list of takeoff headings in the mission.
 */
export const getTakeoffHeadingsInMission: AppSelector<
  MissionSliceState['takeoffHeadings']
> = (state) => state.mission.takeoffHeadings;

/**
 * Returns the current mapping from mission-specific slots to the corresponding
 * UAV identifiers.
 */
export const getMissionMapping: AppSelector<MissionSliceState['mapping']> = (
  state
) => state.mission.mapping;

/**
 * Returns the contents of a file that would encode the current mission mapping
 * as a string.
 *
 * WARN: This is not a pure selector as it encodes the current time in the file.
 */
export const getMissionMappingFileContents: AppSelector<string> = (state) => {
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
export const getEmptyMappingSlotIndices: AppSelector<MissionIndex[]> =
  createSelector(getMissionMapping, (mapping) =>
    mapping
      ? range(mapping.length).filter((index) => isNil(mapping[index]))
      : []
  );

/**
 * Returns the index of the mapping slot being edited.
 */
export const getIndexOfMappingSlotBeingEdited: AppSelector<MissionIndex> = (
  state
) => state.mission.mappingEditor.indexBeingEdited;

/**
 * Returns the reverse mapping from UAV IDs to the corresponding mission IDs.
 */
export const getReverseMissionMapping: AppSelector<Record<UAV['id'], number>> =
  createSelector(getMissionMapping, (mapping) =>
    Object.fromEntries(
      mapping.flatMap((uavId, missionIndex) =>
        isNil(uavId) ? [] : [[uavId, missionIndex]]
      )
    )
  );

/**
 * Returns the ID of the UAV that is currently at the mapping slot being edited.
 */
export const getUAVIdForMappingSlotBeingEdited: AppSelector<
  Nullable<UAV['id']> | undefined
> = createSelector(
  getMissionMapping,
  getIndexOfMappingSlotBeingEdited,
  (mapping, index) => (index >= 0 ? mapping[index] : undefined)
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

/**
 * Returns a list of all the UAV IDs that participate in the mission, without
 * the null entries, sorted in ascending order by the UAV IDs.
 *
 * Note that this also includes the IDs of UAVs that are currently not seen
 * by the server but are nevertheless in the mapping.
 */
export const getUAVIdsParticipatingInMission: AppSelector<Array<UAV['id']>> =
  createSelector(getMissionMapping, (mapping) =>
    rejectNullish(mapping).toSorted()
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
export const getUAVIdsParticipatingInMissionSortedByMissionIndex: AppSelector<
  Array<UAV['id']>
> = createSelector(getMissionMapping, (mapping) => rejectNullish(mapping));

/**
 * Returns whether there is at least one non-empty mapping slot in the mapping.
 */
export const hasNonemptyMappingSlot: AppSelector<boolean> = createSelector(
  getMissionMapping,
  (mapping) => (mapping ? !mapping.every(isNil) : false)
);

/**
 * Returns the index of the communication channel that is currently used to
 * communicate with the UAVs.
 */
export const getPreferredCommunicationChannelIndex: AppSelector<number> = (
  state
) => state.mission.preferredChannelIndex;

/**
 * Returns whether we are broadcasting commands to the drones in the current
 * show from the large flight control panel.
 */
export const areFlightCommandsBroadcast: AppSelector<boolean> = (state) =>
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
export const canAugmentMappingAutomaticallyFromSpareDrones: AppSelector<boolean> =
  createSelector(
    getEmptyMappingSlotIndices,
    getGPSBasedHomePositionsInMission,
    (emptySlots, homePositions) =>
      emptySlots.length > 0 &&
      homePositions.some((position) => !isNil(position))
  );

/**
 * Returns whether the current mapping is editable at the moment.
 */
export const isMappingEditable: AppSelector<boolean> = (state) =>
  state.mission.mappingEditor.enabled;

/**
 * Gets the action to perform when the geofence is breached.
 */
export const getGeofenceAction: AppSelector<GeofenceAction> = (state) =>
  state.mission.geofenceAction || GeofenceAction.KEEP_CURRENT;

/**
 * Gets the action to perform when the geofence is breached, with validation.
 *
 * Throws an error if the geofence action in the state object is not valid.
 */
export const getGeofenceActionWithValidation: AppSelector<GeofenceAction> =
  createSelector(getGeofenceAction, (action) => {
    if (!isValidGeofenceAction(action)) {
      throw new Error('Invalid geofence action: ' + String(action));
    }

    return action;
  });

/**
 * Gets the ID of the polygon that is to be used as a geofence.
 */
export const getGeofencePolygonId: AppSelector<
  MissionSliceState['geofencePolygonId']
> = (state) => state.mission.geofencePolygonId;

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
  Coordinate2D[] | undefined
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
 * Returns whether the mission editor panel should follow the active item.
 */
export const shouldMissionEditorPanelFollowScroll: AppSelector<boolean> = (
  state
) => state.mission.editorPanel.followScroll;

// prettier-ignore
type StringLiteral<T> = T extends string ? string extends T ? never : T : never;

type MissionItemWithExtraField<Field extends PropertyKey, Type> = {
  id: MissionItem['id'];
  index: number;
  item: MissionItem;
} & {
  [field in StringLiteral<Field>]: Type;
};

/**
 * Returns a filtered list of mission items which have a specific type of
 * information, annotated with an extra field that holds said information.
 */
const getMissionItemsWithExtraFieldInOrder = <Field extends PropertyKey, Type>(
  field: StringLiteral<Field>,
  getter: (item: MissionItem) => Type | undefined
): AppSelector<Array<MissionItemWithExtraField<Field, Type>>> =>
  createSelector(
    getMissionItemsInOrder,
    (items) =>
      items
        .map((item, index) => ({
          id: item.id,
          item,
          [field]: getter(item),
          index,
        }))
        .filter((mi) => !isNil(mi[field]))
    // NOTE: I gave up on trying to convince TypeScript to accept this,
    //       the type system seems to have some issues with generics.
    //       Maybe we should try again with Redux Toolkit v2?
  ) as unknown as AppSelector<Array<MissionItemWithExtraField<Field, Type>>>;

/**
 * Returns all the mission items that have areas associated to them. This is
 * used when drawing the mission info layer of the map and during automatic
 * geofence calculation.
 */
export const getMissionItemsWithAreasInOrder: AppSelector<
  Array<MissionItemWithExtraField<'area', { points: Coordinate2D[] }>>
> = getMissionItemsWithExtraFieldInOrder('area', getAreaFromMissionItem);

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
export const getMissionItemsWithCoordinatesInOrder: AppSelector<
  Array<MissionItemWithExtraField<'coordinate', GPSPosition>>
> = getMissionItemsWithExtraFieldInOrder(
  'coordinate',
  getCoordinateFromMissionItem
);

/**
 * Returns a selector that converts the current list of mission items to a
 * list of objects containing the target altitudes which should be reached
 * during a mission, along with the original items themselves and their indices.
 *
 * The returned array will contain objects with the following keys:
 *
 * - id: maps to the ID of the mission item
 * - altitude: object with have two keys: `value` for the value of the altitude
 *                                   and `reference` for the reference altitude
 * - item: maps to the item itself
 * - index: the index of the item in the list of mission items
 *
 * Mission items for which no altitude belongs are not returned.
 */
export const getMissionItemsWithAltitudesInOrder: AppSelector<
  Array<MissionItemWithExtraField<'altitude', Altitude>>
> = getMissionItemsWithExtraFieldInOrder(
  'altitude',
  getAltitudeFromMissionItem
);

/**
 * Returns the coordinates of the convex hull of the currently loaded mission
 * in world coordinates.
 */
export const getConvexHullOfMissionInWorldCoordinates: AppSelector<
  Coordinate2D[]
> = createSelector(
  getGPSBasedHomePositionsInMission,
  getMissionItemsWithCoordinatesInOrder,
  getMissionItemsWithAreasInOrder,
  (homePositions, missionItemsWithCoorinates, missionItemsWithAreas) =>
    convexHull([
      ...rejectNullish(homePositions).map(
        ({ lon, lat }): Coordinate2D => [lon, lat]
      ),
      ...missionItemsWithCoorinates.map(
        ({ coordinate: { lon, lat } }): Coordinate2D => [lon, lat]
      ),
      ...missionItemsWithAreas.flatMap(({ area: { points } }) => points),
    ])
);

/**
 * Returns the coordinates of the convex hull of the currently loaded mission
 * in the coordinate system of the map view.
 */
export const getConvexHullOfMissionInMapViewCoordinates: AppSelector<
  Coordinate2D[]
> = createSelector(
  getConvexHullOfMissionInWorldCoordinates,
  (convexHullOfHomePositionsAndMissionItemsInWorldCoordinates) =>
    convexHullOfHomePositionsAndMissionItemsInWorldCoordinates.map(
      (worldCoordinate) => mapViewCoordinateFromLonLat(worldCoordinate)
    )
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
      return geofence && convexHull && turfContains(geofence, convexHull);
    } else {
      return false;
    }
  }
);

/**
 * Returns the maximum distance of any geofence vertex from any home position.
 */
export const getMaximumDistanceBetweenHomePositionsAndGeofence: AppSelector<number> =
  createSelector(
    getGPSBasedHomePositionsInMission,
    getGeofencePolygonInWorldCoordinates,
    (homePositions, geofencePolygon) => {
      if (!geofencePolygon) {
        return 0;
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

      return max(distances) ?? 0;
    }
  );

/**
 * Returns the maximum distance of any waypoint in the mission from the first
 * home position in the UAV mapping.
 */
export const getMaximumHorizontalDistanceFromHomePositionInWaypointMission: AppSelector<number> =
  createSelector(
    getGPSBasedHomePositionsInMission,
    getMissionItemsWithCoordinatesInOrder,
    getMissionItemsWithAreasInOrder,
    ([homePosition], missionItemsWithCoorinates, missionItemsWithAreas) => {
      if (!homePosition) {
        return 0;
      }

      const homePoint = TurfHelpers.point([homePosition.lon, homePosition.lat]);
      return (
        max(
          [
            ...missionItemsWithCoorinates.map<[number, number]>(
              ({ coordinate: { lon, lat } }) => [lon, lat]
            ),
            ...missionItemsWithAreas.flatMap(({ area: { points } }) => points),
          ].map((point) =>
            turfDistanceInMeters(homePoint, TurfHelpers.point(point))
          )
        ) ?? 0
      );
    }
  );

/**
 * Returns the maximum target altitude that appears among the waypoints.
 */
export const getMaximumHeightOfWaypoints: AppSelector<number> = createSelector(
  getMissionItemsWithAltitudesInOrder,
  (missionItemsWithAltitude) =>
    // TODO: Handle different altitude references?
    max(missionItemsWithAltitude.map((mi) => mi.altitude.value)) ?? 0
);

/**
 * Selector that returns whether the mission planner dialog is open.
 */
export const isMissionPlannerDialogOpen: AppSelector<boolean> = (state) =>
  state.mission.plannerDialog.open;

/**
 * Selector that returns the mapping to be used when setting parameters for the
 * mission planner from the context.
 */
export const getMissionPlannerDialogContextParameters: AppSelector<
  MissionSliceState['plannerDialog']['parameters']['fromContext']
> = (state) => state.mission.plannerDialog.parameters.fromContext;

/**
 * Selector that returns the parameters for the mission planner set by the user.
 */
export const getMissionPlannerDialogUserParameters: AppSelector<
  MissionSliceState['plannerDialog']['parameters']['fromUser']
> = (state) => state.mission.plannerDialog.parameters.fromUser;

/**
 * Selector that returns the parameters used in the last successful invocation
 * of the mission planner.
 */
export const getLastSuccessfulPlannerInvocationParameters: AppSelector<
  MissionSliceState['lastSuccessfulPlannerInvocationParameters']
> = (state) => state.mission.lastSuccessfulPlannerInvocationParameters;

/**
 * Selector that returns the mission type currently selected for planning.
 */
export const getMissionPlannerDialogSelectedType: AppSelector<
  string | undefined
> = (state) => state.mission.plannerDialog.selectedType;

/**
 * Selector that returns whether the mission planner dialog should apply an
 * automatically generated geofence.
 */
export const shouldMissionPlannerDialogApplyGeofence: AppSelector<boolean> = (
  state
) => state.mission.plannerDialog.applyGeofence;

/**
 * Selector that returns the backup of the last cleared mission data.
 */
export const getLastClearedMissionData: AppSelector<
  MissionSliceState['lastClearedMissionData']
> = (state) => state.mission.lastClearedMissionData;

type Segment = {
  item: MissionItem;
  distance?: number;
  velocity?: number;
};

type Accumulator = {
  _altitudeReference?: AltitudeReference;
  _position: {
    xy?: TurfHelpers.Coord;
    z: Record<AltitudeReference, number | undefined>;
  };
  _velocity: { xy?: number; z?: number };
  segments: Segment[];
};

/**
 * Selector that returns the items of the mission wrapped together with distance
 * and velocity information where movement is involved.
 */
export const getMissionItemsInOrderAsSegments: AppSelector<Segment[]> =
  createSelector(
    getGPSBasedHomePositionsInMission,
    getMissionItemsInOrder,
    ([homePosition], items) => {
      const home = homePosition && {
        xy: TurfHelpers.point([homePosition.lon, homePosition.lat]),
        z: {
          [AltitudeReference.GROUND]: homePosition.agl,
          [AltitudeReference.HOME]: homePosition.ahl,
          [AltitudeReference.MSL]: homePosition.amsl,
        },
      };
      try {
        // eslint-disable-next-line unicorn/no-array-reduce
        return items.reduce<Accumulator>(
          (state, item) =>
            produce(state, (draft) => {
              const next: Segment = { item };

              const moveToXY = (target: TurfHelpers.Coord): void => {
                draft._position.xy = target;

                if (state._position.xy) {
                  next.distance = turfDistanceInMeters(
                    state._position.xy,
                    target
                  );
                  next.velocity = state._velocity.xy;
                }
              };

              const moveToZ = ({
                value: target,
                reference,
              }: Altitude): void => {
                draft._altitudeReference = reference;
                draft._position.z[reference] = target;

                const prevZ = state._position.z[reference];
                if (
                  prevZ !== undefined &&
                  (!state._altitudeReference ||
                    // TODO: Mixed references should probably raise a warning.
                    state._altitudeReference === reference)
                ) {
                  next.distance = Math.abs(prevZ - target);
                  next.velocity = state._velocity.z;
                }
              };

              // TODO: According to the server code some mission item types
              // can have optional parameters for altitude and velocities.
              // We should include that information when it is available.
              switch (item.type) {
                /* =================== Changing velocity =================== */

                case MissionItemType.CHANGE_SPEED: {
                  draft._velocity.xy =
                    item.parameters.velocityXY ?? state._velocity.xy;
                  draft._velocity.z =
                    item.parameters.velocityZ ?? state._velocity.z;
                  break;
                }

                /* =================== Changing altitude =================== */

                case MissionItemType.TAKEOFF: {
                  moveToZ(item.parameters.alt);
                  break;
                }

                case MissionItemType.CHANGE_ALTITUDE: {
                  moveToZ(item.parameters.alt);
                  break;
                }

                case MissionItemType.LAND: {
                  if (home && state._altitudeReference !== undefined) {
                    // NOTE: This can be simplified after TypeScript 5.5:
                    //       https://devblogs.microsoft.com/typescript/announcing-typescript-5-5/#control-flow-narrowing-for-constant-indexed-accesses
                    const homeZ = home.z[state._altitudeReference];
                    if (homeZ !== undefined) {
                      moveToZ({
                        value: homeZ,
                        reference: state._altitudeReference,
                      });
                    }
                  }

                  break;
                }

                /* =================== Changing position =================== */

                case MissionItemType.GO_TO: {
                  moveToXY(
                    TurfHelpers.point([
                      item.parameters.lon,
                      item.parameters.lat,
                    ])
                  );

                  break;
                }

                case MissionItemType.RETURN_TO_HOME: {
                  if (home) {
                    moveToXY(home.xy);
                  }

                  break;
                }

                default:
                // The remaining mission item types do not contain movement
              }

              draft.segments.push(next);
            }),
          {
            // The first item to have altitude information can choose which
            // reference type to use
            _altitudeReference: undefined,
            _position: {
              xy: home?.xy,
              z: home?.z ?? {
                [AltitudeReference.GROUND]: undefined,
                [AltitudeReference.HOME]: undefined,
                [AltitudeReference.MSL]: undefined,
              },
            },
            _velocity: { xy: undefined, z: undefined },
            segments: [],
          }
        ).segments;
      } catch (error) {
        console.error(`Route segment calculation error:`, error);
        return [];
      }
    }
  );

/**
 * Selector that returns estimates about the mission.
 *
 * TODO: Calculate distances and durations separately and sum the afterwards?
 *
 * @returns {Object} estimates
 * @property {number} distance - the length of the planned trajectory in meters
 * @property {number} duration - the expected duration of the mission in seconds
 */
export const getMissionEstimates: AppSelector<{
  distance: number;
  duration: number;
}> = createSelector(getMissionItemsInOrderAsSegments, (segments) =>
  // eslint-disable-next-line unicorn/no-array-reduce
  segments.reduce(
    ({ distance, duration }, s) => ({
      distance: distance + (s.distance ?? 0),
      duration:
        duration +
        (s.distance !== undefined && s.velocity !== undefined
          ? estimatePathDuration(s.distance, s.velocity)
          : 0),
    }),
    { distance: 0, duration: 0 }
  )
);

/**
 * Selector that returns the id of the mission item that's currently being
 * executed.
 */
export const getCurrentMissionItemId: AppSelector<
  MissionItem['id'] | undefined
> = (state) => state.mission.progress.currentItemId;

/**
 * Selector that returns the index of the mission item that's currently being
 * executed.
 */
export const getCurrentMissionItemIndex: AppSelector<number | undefined> =
  createSelector(
    getMissionItemIds,
    getCurrentMissionItemId,
    (ids, currentId) =>
      currentId === undefined ? undefined : ids.indexOf(currentId)
  );

/**
 * Selector that returns the progress ratio of the mission item that's
 * currently being executed.
 */
export const getCurrentMissionItemRatio: AppSelector<number | undefined> = (
  state
) => state.mission.progress.currentItemRatio;

/**
 * Selector that returns whether mission progress information has been received.
 */
export const isProgressInformationAvailable: AppSelector<boolean> = (state) =>
  state.mission.progress.currentItemId !== undefined;

/**
 * Selector that returns the starting ratio of a partial mission.
 */
export const getStartRatioOfPartialMission: AppSelector<number> =
  createSelector(getMissionItemsInOrder, (items) =>
    Number(
      items.find(
        (mi): mi is MissionItem & { type: MissionItemType.MARKER } =>
          mi.type === MissionItemType.MARKER &&
          mi.parameters.marker === MarkerType.START
      )?.parameters?.ratio ?? 0
    )
  );

/**
 * Selector that returns the ending ratio of a partial mission.
 */
export const getEndRatioOfPartialMission: AppSelector<number> = createSelector(
  getMissionItemsInOrder,
  (items) =>
    Number(
      items.find(
        (mi): mi is MissionItem & { type: MissionItemType.MARKER } =>
          mi.type === MissionItemType.MARKER &&
          mi.parameters.marker === MarkerType.END
      )?.parameters?.ratio ?? 1
    )
);

/**
 * Selector that returns the completion ratio of the net mission.
 *
 * @returns {number} the ratio of the done and total lengths of the net mission
 */
export const getNetMissionCompletionRatio: AppSelector<number> = createSelector(
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
              parameters.marker === MarkerType.START ? { _isNet: true  } :
              parameters.marker === MarkerType.END   ? { _isNet: false } :
              {}
            )
          ),
          // If we are currently in the useful (net) part of the mission,
          // accumulate the done and total distance appropriately
          ...(
            _isNet && {
              doneDistance: doneDistance + (
                // The item is currently active, apply the ratio to its distance
                isCurrent ? distance * (currentRatio ?? 0) :
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
export const getGlobalMissionCompletionRatio: AppSelector<number> =
  createSelector(
    getStartRatioOfPartialMission,
    getEndRatioOfPartialMission,
    getNetMissionCompletionRatio,
    (start, end, localRatio) => start + (end - start) * localRatio
  );

/**
 * Selector that returns whether there is a partially completed mission that can
 * be resumed from an interruption point.
 */
export const isMissionPartiallyCompleted: AppSelector<boolean> = createSelector(
  getGlobalMissionCompletionRatio,
  (ratio) => ratio > 0 && ratio < 1
);

/**
 * Selector that collects data about the current mission that can be used for
 * recalling it later.
 */
export const getMissionDataForStorage: AppSelector<{
  lastSuccessfulPlannerInvocationParameters: MissionSliceState['lastSuccessfulPlannerInvocationParameters'];
  name?: string;
  items: MissionItem[];
  homePositions: Array<Nullable<GPSPosition>>;
  progress: {
    id?: string;
    ratio?: number;
  };
}> = createSelector(
  getLastSuccessfulPlannerInvocationParameters,
  getMissionName,
  getMissionItemsInOrder,
  getGPSBasedHomePositionsInMission,
  getCurrentMissionItemId,
  getCurrentMissionItemRatio,
  (
    lastSuccessfulPlannerInvocationParameters,
    name,
    items,
    homePositions,
    currentMissionItemId,
    currentMissionItemRatio
  ) => ({
    lastSuccessfulPlannerInvocationParameters,
    name,
    items,
    homePositions,
    progress: {
      id: currentMissionItemId,
      ratio: currentMissionItemRatio,
    },
  })
);
