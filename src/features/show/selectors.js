/* eslint unicorn/no-array-callback-reference: 0 */

import formatDate from 'date-fns/format';
import formatISO9075 from 'date-fns/formatISO9075';
import fromUnixTime from 'date-fns/fromUnixTime';
import get from 'lodash-es/get';
import identity from 'lodash-es/identity';
import isNil from 'lodash-es/isNil';
import max from 'lodash-es/max';
import maxBy from 'lodash-es/maxBy';

import { createSelector } from '@reduxjs/toolkit';
import createCachedSelector from 're-reselect';
import turfContains from '@turf/boolean-contains';

import { CommonClockId } from '~/features/clocks/types';
import {
  proposeDistanceLimit,
  proposeHeightLimit,
} from '~/features/geofence/utils';
import {
  getGeofencePolygonInWorldCoordinates,
  selectMissionIndex,
} from '~/features/mission/selectors';
import { formatDuration, formatDurationHMS } from '~/utils/formatting';
import { FlatEarthCoordinateSystem } from '~/utils/geography';
import {
  convexHull,
  createGeometryFromPoints,
  euclideanDistance2D,
  getCentroid,
} from '~/utils/math';
import { EMPTY_ARRAY, EMPTY_OBJECT } from '~/utils/redux';

import {
  AltitudeReference,
  DEFAULT_ALTITUDE_REFERENCE,
  DEFAULT_ROOM_SIZE,
  DEFAULT_TAKEOFF_HEADING,
  TakeoffHeadingMode,
} from './constants';
import {
  getConvexHullOfTrajectory,
  getFirstPointOfTrajectory,
  getLastPointOfTrajectory,
  getMaximumHeightOfTrajectory,
  getPointsOfTrajectory,
  getTrajectoryDuration,
  isValidTrajectory,
} from './trajectory';
import { isYawActivelyControlled } from './yaw';

/**
 * Returns whether the manual preflight checks are signed off (i.e. approved)
 * by the operator.
 */
export const areManualPreflightChecksSignedOff = (state) =>
  Boolean(state.show.preflight.manualChecksSignedOffAt);

/**
 * Returns whether the onboard preflight checks are signed off (i.e. approved)
 * by the operator.
 */
export const areOnboardPreflightChecksSignedOff = (state) =>
  Boolean(state.show.preflight.onboardChecksSignedOffAt);

/**
 * Returns whether the start time and start method of the show are synchronized
 * with the server (i.e. the server "knows" about the same desired start time
 * as the client).
 */
export const areStartConditionsSyncedWithServer = (state) =>
  state.show.start.syncStatusWithServer === 'synced';

/**
 * Returns the number of drones that are currently scheduled to take off
 * automatically on the server.
 */
export const countUAVsTakingOffAutomatically = (state) => {
  const toStart = state.show.start.uavIds;
  return toStart ? toStart.length : 0;
};

/**
 * Returns whether the last attempt to load a show ended with a failure.
 */
export const didLastLoadingAttemptFail = (state) =>
  state.show.lastLoadAttemptFailed;

/**
 * Returns whether the synchronization of the start time and start method of the
 * show with the server failed when we attempted it the last time.
 */
export const didStartConditionSyncFail = (state) =>
  state.show.start.syncStatusWithServer === 'error';

/**
 * Returns the name of the file that the currently loaded show came from.
 * Returns null if the currently loaded show comes from another source, the
 * environment did not tell us the full path of the file, or there is no loaded
 * show.
 */
export const getAbsolutePathOfShowFile = createSelector(
  (state) => state.show.sourceUrl,
  (url) =>
    url && url.startsWith('file://') ? url.slice('file://'.length) : null
);

/**
 * Returns whether there is a scheduled start time for the drone show.
 */
export const hasScheduledStartTime = (state) => !isNil(getShowStartTime(state));

/**
 * Returns whether the show has changed externally since the time it was
 * loaded into the app.
 */
export const hasShowChangedExternallySinceLoaded = (state) =>
  state.show.changedSinceLoaded;

/**
 * Returns whether the show has received human authorization to start,
 * irrespectively of whether this setting has been synchronized to the server
 * or not.
 */
export const isShowAuthorizedToStartLocally = (state) =>
  Boolean(state.show.start.authorized);

/**
 * Returns whether the show has received human authorization to start _and_
 * this has been synchronized with the server.
 */
export const isShowAuthorizedToStart = (state) =>
  isShowAuthorizedToStartLocally(state) &&
  areStartConditionsSyncedWithServer(state);

/**
 * Returns whether the takeoff area arrangement was approved by the operator.
 */
export const isTakeoffAreaApproved = (state) =>
  Boolean(state.show.preflight.takeoffAreaApprovedAt);

/**
 * Returns the common show settings that apply to all drones in the currently
 * loaded show.
 */
export const getCommonShowSettings = (state) => {
  const result = get(state, 'show.data.settings');
  return typeof result === 'object' ? result : EMPTY_OBJECT;
};

/**
 * Returns the specification of the drone swarm in the currently loaded show.
 */
export const getDroneSwarmSpecification = (state) => {
  const result = get(state, 'show.data.swarm.drones');
  return Array.isArray(result) ? result : EMPTY_ARRAY;
};

/**
 * Selector that returns the type of the show (indoor or outdoor).
 */
export const getShowEnvironmentType = (state) => state.show.environment.type;

/**
 * Selector that returns whether the show is indoor.
 */
export const isShowIndoor = (state) =>
  getShowEnvironmentType(state) === 'indoor';

/**
 * Selector that returns whether the show is outdoor.
 */
export const isShowOutdoor = (state) =>
  getShowEnvironmentType(state) === 'outdoor';

/**
 * Selector that returns whether the show uses yaw control for at least one drone.
 */
export const isShowUsingYawControl = createSelector(
  getDroneSwarmSpecification,
  (swarm) =>
    swarm.some((drone) => {
      const yawControl = get(drone, 'settings.yawControl');
      return isYawActivelyControlled(yawControl);
    })
);

/**
 * Selector that returns the part of the state object that is related to the
 * altitude reference of the show.
 */
export const getOutdoorShowAltitudeReference = (state) => {
  const result = get(state, 'show.environment.outdoor.altitudeReference');
  return result || DEFAULT_ALTITUDE_REFERENCE;
};

/**
 * Selector that returns the mean sea level that the Z coordinates of the show
 * should be referred to, or null if the show is controlled based on altitudes
 * above home level.
 */
export const getMeanSeaLevelReferenceOfShowCoordinatesOrNull = (state) => {
  if (!isShowOutdoor(state)) {
    return null;
  }

  const altitudeReference = getOutdoorShowAltitudeReference(state);
  return altitudeReference &&
    altitudeReference.type === AltitudeReference.AMSL &&
    typeof altitudeReference.value === 'number' &&
    Number.isFinite(altitudeReference.value)
    ? altitudeReference.value
    : null;
};

/**
 * Selector that returns whether the show is tied to a specific altitude above
 * mean sea level.
 *
 * If this selector is true, it means that we can assign a fixed AMSL value to
 * each show-specific Z coordinate by adding the show-specific Z coordinate to
 * the AMSL reference. If this selector is false, it means that the show is
 * controlled in AHL. Indoor shows are always controlled in AHL.
 */
export const isShowRelativeToMeanSeaLevel = (state) =>
  !isNil(getMeanSeaLevelReferenceOfShowCoordinatesOrNull(state));

/**
 * Selector that returns the definition of the coordinate system of an indoor
 * show.
 */
export const getIndoorShowCoordinateSystem = (state) =>
  get(state, 'show.environment.indoor.coordinateSystem');

/**
 * Selector that returns the definition of the coordinate system of an outdoor
 * show.
 */
export const getOutdoorShowCoordinateSystem = (state) =>
  get(state, 'show.environment.outdoor.coordinateSystem');

/**
 * Selector that returns the orientation of the positive X axis of the
 * indoor show coordinate system, cast into a float.
 *
 * This is needed because we store the orientation of the show coordinate
 * system as a string by default to avoid rounding errors, but most components
 * require a float instead.
 */
export const getIndoorShowOrientation = createSelector(
  getIndoorShowCoordinateSystem,
  (coordinateSystem) =>
    coordinateSystem ? Number.parseFloat(coordinateSystem.orientation) : 0
);

/**
 * Selector that returns the origin of the outdoor show coordinate system.
 */
export const getOutdoorShowOrigin = createSelector(
  getOutdoorShowCoordinateSystem,
  (coordinateSystem) => coordinateSystem.origin
);

/**
 * Selector that returns the orientation of the positive X axis of the
 * outdoor show coordinate system, cast into a float.
 *
 * This is needed because we store the orientation of the show coordinate
 * system as a string by default to avoid rounding errors, but most components
 * require a float instead.
 */
export const getOutdoorShowOrientation = createSelector(
  getOutdoorShowCoordinateSystem,
  (coordinateSystem) => Number.parseFloat(coordinateSystem.orientation)
);

/**
 * Returns the orientation of the positive X axis of the show coordinate system,
 * irrespectively of whether this is an indoor or an outdoor show.
 */
export const getShowOrientation = createSelector(
  isShowIndoor,
  getIndoorShowOrientation,
  getOutdoorShowOrientation,
  (indoor, indoorOrientation, outdoorOrientation) =>
    indoor ? indoorOrientation : outdoorOrientation
);

/**
 * Selector that returns the part of the state object that specifies how the
 * takeoff headings of the show should be calculated when it is an outdoor show.
 */
export const getOutdoorShowTakeoffHeadingSpecification = (state) => {
  const result = get(state, 'show.environment.outdoor.takeoffHeading');
  return result || DEFAULT_TAKEOFF_HEADING;
};

/**
 * Selector that returns the part of the state object that specifies how the
 * takeoff headings of the show should be calculated when it is an indoor show.
 */
export const getIndoorShowTakeoffHeadingSpecification = (state) => {
  const result = get(state, 'show.environment.indoor.takeoffHeading');
  return result || DEFAULT_TAKEOFF_HEADING;
};

/**
 * Selector that returns the takeoff heading specification of the show,
 * irrespectively of whether this is an indoor or an outdoor show.
 */
export const getTakeoffHeadingSpecification = createSelector(
  isShowIndoor,
  getIndoorShowTakeoffHeadingSpecification,
  getOutdoorShowTakeoffHeadingSpecification,
  (indoor, indoorSpec, outdoorSpec) => (indoor ? indoorSpec : outdoorSpec)
);

const convertTakeoffHeadingSpecificationValueToNumber = (spec) => {
  const { value } = typeof spec === 'object' ? spec : DEFAULT_TAKEOFF_HEADING;

  const valueAsNum =
    typeof value === 'string'
      ? Number.parseFloat(value)
      : typeof value === 'number'
        ? value
        : 0;

  return valueAsNum % 360;
};

/**
 * Selector that returns the value in the takeoff heading specification,
 * safely cast into a number.
 */
export const getTakeoffHeadingSpecificationValueAsNumber = (state) => {
  const spec = getTakeoffHeadingSpecification(state);
  return convertTakeoffHeadingSpecificationValueToNumber(spec);
};

/**
 * Selector that returns a function that calculates the effective takeoff
 * heading of the show, given the takeoff heading specification.
 */
export const getCommonTakeoffHeading = createSelector(
  getTakeoffHeadingSpecification,
  getShowOrientation,
  (spec, orientation) => {
    const { type } = typeof spec === 'object' ? spec : DEFAULT_TAKEOFF_HEADING;
    const value = convertTakeoffHeadingSpecificationValueToNumber(spec);

    switch (type) {
      case TakeoffHeadingMode.NONE:
        return undefined;

      case TakeoffHeadingMode.ABSOLUTE:
        return value;

      case TakeoffHeadingMode.RELATIVE:
        return (orientation + value) % 360;

      default:
        return undefined;
    }
  }
);

/**
 * Returns the width of the room that the indoor show is taking place.
 */
export const getRoomCorners = createSelector(
  (state) => state.show.environment?.indoor?.room?.firstCorner,
  (state) => state.show.environment?.indoor?.room?.secondCorner,
  (firstCorner, secondCorner) => [
    firstCorner || [
      -DEFAULT_ROOM_SIZE.width / 2,
      -DEFAULT_ROOM_SIZE.depth / 2,
      0,
    ],
    secondCorner || [
      DEFAULT_ROOM_SIZE.width / 2,
      DEFAULT_ROOM_SIZE.depth / 2,
      DEFAULT_ROOM_SIZE.height,
    ],
  ]
);

/**
 * Returns whether the indoor room should be shown on the 3D view.
 */
export const isRoomVisible = (state) =>
  isShowIndoor(state) && state.show.environment.indoor?.room?.visible;

/**
 * Selector that returns an object that can be used to transform GPS coordinates
 * from/to the show coordinate system.
 */
export const getOutdoorShowToWorldCoordinateSystemTransformationObject =
  createSelector(getOutdoorShowCoordinateSystem, (coordinateSystem) =>
    coordinateSystem && coordinateSystem.origin
      ? new FlatEarthCoordinateSystem(coordinateSystem)
      : undefined
  );

/**
 * Selector that returns a function that can be invoked with show coordinate
 * XYZ triplets and that returns the corresponding world coordinates.
 */
export const getOutdoorShowToWorldCoordinateSystemTransformation =
  createSelector(
    getOutdoorShowToWorldCoordinateSystemTransformationObject,
    (transform) =>
      transform
        ? (point) => {
            if (isNil(point)) {
              return undefined;
            }

            const [x, y, z] = point;
            const [lon, lat] = transform.toLonLat([x, y]);
            return { lon, lat, amsl: undefined, ahl: z };
          }
        : undefined
  );

// TODO(ntamas): implement this for outdoor shows
export const getShowToFlatEarthCoordinateSystemTransformation = createSelector(
  isShowIndoor,
  (indoor) => (indoor ? identity : undefined)
);

/**
 * Returns the number of drones in the currently loaded show.
 */
export const getNumberOfDronesInShow = createSelector(
  getDroneSwarmSpecification,
  (swarm) => swarm.length
);

/**
 * Returns an array containing all the trajectories. The array will contain
 * undefined for all the drones that have no fixed trajectories in the mission.
 */
export const getTrajectories = createSelector(
  getDroneSwarmSpecification,
  (swarm) =>
    swarm.map((drone) => {
      const trajectory = get(drone, 'settings.trajectory');
      return isValidTrajectory(trajectory) ? trajectory : undefined;
    })
);

/**
 * Returns the trajectory of the given mission index, in world coordinates,
 * given the current state.
 *
 * @param  {Object}  state  the state of the application
 * @param  {string}  missionIndex  the index of the mission slot
 */
export const getTrajectoryPointsInWorldCoordinatesByMissionIndex =
  createCachedSelector(
    getTrajectories,
    getOutdoorShowToWorldCoordinateSystemTransformation,
    selectMissionIndex,
    (trajectories, transform, missionIndex) => {
      if (transform === undefined) {
        // No show coordinate system yet or the show is indoor
        return undefined;
      }

      const trajectory = trajectories[missionIndex];
      if (isValidTrajectory(trajectory)) {
        return getPointsOfTrajectory(trajectory, {
          includeControlPoints: true,
        }).map(transform);
      }

      return undefined;
    }
  )({
    keySelector: selectMissionIndex,
    // TODO: use a FIFO or LRU cache if it becomes necessary.
    // The quick-lru module from npm seems simple enough.
  });

/**
 * Returns an array holding the convex hulls of all the trajectories.
 */
export const getConvexHullsOfTrajectories = createSelector(
  getTrajectories,
  (trajectories) => trajectories.map(getConvexHullOfTrajectory)
);

/**
 * Returns the coordinates of the convex hull of the currently loaded show.
 * These are in the flat Earth coordinate system of the show so they are not
 * usable directly on the map. Use `getConvexHullOfShowInWorldCoordinates()` if
 * you need them as GPS coordinates.
 */
export const getConvexHullOfShow = createSelector(
  getConvexHullsOfTrajectories,
  (convexHulls) => convexHull(convexHulls.flat())
);

const transformPoints = (points, transform) =>
  transform ? points.map(transform) : [];

const transformPointsOrFillWithUndefined = (points, transform) =>
  transform
    ? points.map(transform)
    : Array.from({ length: points.length }).fill(undefined);

/**
 * Returns the coordinates of the convex hull of the currently loaded show, in
 * world coordinates.
 */
export const getConvexHullOfShowInWorldCoordinates = createSelector(
  getConvexHullOfShow,
  getOutdoorShowToWorldCoordinateSystemTransformation,
  transformPoints
);

/**
 * Returns an array holding the first points of all the trajectories.
 * These are in the flat Earth coordinate system of the show so they are not
 * usable directly as home positions. Use
 * `getFirstPointsOfTrajectoriesInWorldCoordinates()` if you need them
 * as GPS coordinates.
 */
export const getFirstPointsOfTrajectories = createSelector(
  getTrajectories,
  (trajectories) => trajectories.map(getFirstPointOfTrajectory)
);

/**
 * Returns an array holding the first points of all the trajectories, in
 * world coordinates.
 */
export const getFirstPointsOfTrajectoriesInWorldCoordinates = createSelector(
  getFirstPointsOfTrajectories,
  getOutdoorShowToWorldCoordinateSystemTransformation,
  transformPointsOrFillWithUndefined
);

/**
 * Returns the geometric center of the first points of all the trajectories, in
 * world coordinates.
 */
export const getCenterOfFirstPointsOfTrajectoriesInWorldCoordinates =
  createSelector(
    getFirstPointsOfTrajectoriesInWorldCoordinates,
    (firstPoints) => {
      const [lon, lat] = getCentroid(firstPoints.map((p) => [p.lon, p.lat]));
      return { lon, lat };
    }
  );

/**
 * Gets the coordinates of the polygon that is to be used as a geofence. These
 * are in the flat Earth coordinate system of the show so they are not
 * usable directly on the map. Use `getGeofencePolygonInWorldCoordinates()` if
 * you need them as GPS coordinates.
 *
 * Returns undefined if no geofence polygon is defined, the show is indoors
 * or there is no show coordinate system defined yet.
 */
export const getGeofencePolygonInShowCoordinates = createSelector(
  getGeofencePolygonInWorldCoordinates,
  getOutdoorShowToWorldCoordinateSystemTransformationObject,
  (polygon, transform) =>
    Array.isArray(polygon) && transform && transform.fromLonLat
      ? polygon.map((c) => transform.fromLonLat(c))
      : undefined
);

/**
 * Returns an array holding the last points of all the trajectories.
 * These are in the flat Earth coordinate system of the show so they are not
 * usable directly as landing positions. Use
 * `getLastPointsOfTrajectoriesInWorldCoordinates()` if you need them
 * as GPS coordinates.
 */
export const getLastPointsOfTrajectories = createSelector(
  getTrajectories,
  (trajectories) => trajectories.map(getLastPointOfTrajectory)
);

/**
 * Returns an array holding the last points of all the trajectories, in
 * world coordinates.
 */
export const getLastPointsOfTrajectoriesInWorldCoordinates = createSelector(
  getLastPointsOfTrajectories,
  getOutdoorShowToWorldCoordinateSystemTransformation,
  transformPointsOrFillWithUndefined
);

/**
 * Returns the maximum distance of any point in a trajectory from its starting
 * point. Returns 0 for empty trajectories.
 */
function getMaximumHorizontalDistanceFromTakeoffPositionInTrajectory(
  trajectory
) {
  if (!isValidTrajectory(trajectory)) {
    return 0;
  }

  const { points = [] } = trajectory;
  if (points.length === 0) {
    return 0;
  }

  // TODO(ntamas): calculate distances only for the convex hull of the trajectory!

  const firstKeyframe = points[0];
  const firstPoint = firstKeyframe[1];

  const distanceToFirstPoint = (keyframe) => {
    const point = keyframe[1];
    return euclideanDistance2D(point, firstPoint);
  };

  const farthestPoint = maxBy(points, distanceToFirstPoint);
  return farthestPoint ? distanceToFirstPoint(farthestPoint) : 0;
}

/**
 * Returns the maximum distance of any point in any of the trajectories from the
 * starting point of that trajectory.
 */
export const getMaximumHorizontalDistanceFromTakeoffPositionInTrajectories =
  createSelector(
    getTrajectories,
    (trajectories) =>
      max(
        trajectories.map(
          getMaximumHorizontalDistanceFromTakeoffPositionInTrajectory
        )
      ) || 0
  );

/**
 * Returns the maximum height observed in any of the trajectories, in the
 * show coordinate system.
 */
export const getMaximumHeightInTrajectories = createSelector(
  getTrajectories,
  (trajectories) => max(trajectories.map(getMaximumHeightOfTrajectory)) || 0
);

/**
 * Returns the automatically calculated distance limit by adding the declared
 * horizontal safety margin to the distances of the farthest points of the show
 * trajectories from the takeoff positions.
 */
export const getProposedDistanceLimitBasedOnTrajectories = (state) => {
  const maxDistance =
    getMaximumHorizontalDistanceFromTakeoffPositionInTrajectories(state);
  const margin = get(state, 'dialogs.geofenceSettings.horizontalMargin');
  return proposeDistanceLimit(maxDistance, margin);
};

/**
 * Returns the automatically calculated height limit by adding the declared
 * vertical safety margin to the highest point of the show trajectories.
 */
export const getProposedHeightLimitBasedOnTrajectories = (state) => {
  const maxHeight = getMaximumHeightInTrajectories(state);
  const margin = get(state, 'dialogs.geofenceSettings.verticalMargin');
  return proposeHeightLimit(maxHeight, margin);
};

/**
 * Returns the total duration of the show, in seconds.
 */
export const getShowDuration = createSelector(
  getTrajectories,
  (trajectories) => {
    const longest = maxBy(trajectories, getTrajectoryDuration);
    return longest ? getTrajectoryDuration(longest) : 0;
  }
);

/**
 * Returns the total duration of the show, as a human-readable string.
 */
export const getShowDurationAsString = createSelector(
  getShowDuration,
  formatDuration
);

/**
 * Returns a suitable short one-line description for the current show file.
 */
export const getShowDescription = createSelector(
  getNumberOfDronesInShow,
  getShowDurationAsString,
  getMaximumHeightInTrajectories,
  isShowUsingYawControl,
  (numberDrones, duration, maxHeight, hasYawControl) =>
    `${numberDrones} drones, ${duration}, max AHL ${maxHeight.toFixed(1)}m` +
    (hasYawControl ? ', yaw controlled' : '')
);

/**
 * Returns the progress of the current show loading process, as a percentage
 * between 0 and 100.
 */
export const getShowLoadingProgressPercentage = (state) => {
  const { progress } = state.show;
  return typeof progress === 'number' ? progress * 100 : null;
};

/**
 * Returns the user-defined distance limit, which should be above the automatically
 * proposed distance limit.
 */
export const getUserDefinedDistanceLimit = (state) => {
  // TODO(ntamas): this should be configurable by the user and not simply set
  // based on the proposal
  return getProposedDistanceLimitBasedOnTrajectories(state);
};

/**
 * Returns the user-defined height limit, which should be above the automatically
 * proposed height limit.
 */
export const getUserDefinedHeightLimit = (state) => {
  // TODO(ntamas): this should be configurable by the user and not simply set
  // based on the proposal
  return getProposedHeightLimitBasedOnTrajectories(state);
};

/**
 * Returns the reference clock that the show clock is syncing to.
 */
export const getShowClockReference = (state) => state.show.start.clock ?? null;

/**
 * Returns the metadata of the show, if any.
 */
export const getShowMetadata = createSelector(
  (state) => state.show.data,
  (data) => (data && typeof data.meta === 'object' ? data.meta : null) || {}
);

/**
 * Returns the start method of the show.
 */
export const getShowStartMethod = (state) => state.show.start.method;

/**
 * Returns the start time of the show. The start time is returned as the number
 * of seconds elapsed from the epoch of the associated show clock, or since the
 * UNIX epoch if there is no associated show clock. Returns undefined if no
 * start time was scheduled yet.
 */
export const getShowStartTime = (state) => {
  const { clock, timeOnClock, utcTime } = state.show.start;
  const time = isNil(clock) ? utcTime : timeOnClock;
  return isNil(time) || Number.isNaN(time) ? null : time;
};

/**
 * Returns the scheduled start time of the show as a string. Returns undefined
 * if no start time is set.
 */
export const getShowStartTimeAsString = createSelector(
  getShowClockReference,
  getShowStartTime,
  (clock, time) =>
    isNil(clock)
      ? time
        ? formatISO9075(fromUnixTime(time))
        : undefined
      : clock === CommonClockId.MTC
        ? time
          ? formatDurationHMS(time, { padHours: true }) + ' MTC'
          : undefined
        : formatDurationHMS(time, { padHours: true }) + ` on clock ${clock}`
);

/**
 * Returns a suitable title string for the current show file.
 */
export const getShowTitle = createSelector(
  getShowMetadata,
  getNumberOfDronesInShow,
  (meta, numberDrones) => meta.title || `Show with ${numberDrones} drones`
);

/**
 * Returns whether there is a show file currently loaded.
 */
export const hasLoadedShowFile = (state) => Boolean(state.show.data);

/**
 * Returns whether the origin of the coordinate system of the show has been
 * set up.
 */
export const hasShowOrigin = (state) =>
  Boolean(get(state, 'show.environment.outdoor.coordinateSystem.origin'));

/**
 * Returns whether we are currently loading a show file.
 */
export const isLoadingShowFile = (state) => state.show.loading;

/**
 * Returns whether the convex hull of the show is fully contained inside the
 * geofence polygon.
 */
export const isShowConvexHullInsideGeofence = createSelector(
  getConvexHullOfShowInWorldCoordinates,
  getGeofencePolygonInWorldCoordinates,
  (convexHull, geofence) => {
    if (convexHull) {
      convexHull = convexHull.map((point) => [point.lon, point.lat]);
    }

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
 * Proposes a name for a mapping file of the current show. Not a pure selector
 * as the filename contains the current date and time.
 */
export function proposeMappingFileName(state) {
  // ISO format cannot be used because colons are usually not allowed in
  // filenames
  const date = formatDate(new Date(), 'yyyy-MM-dd_HH-mm-ss');
  const path = getAbsolutePathOfShowFile(state);
  const lastSlashIndex = path ? path.lastIndexOf('/') : -1;
  const filename =
    path && lastSlashIndex >= 0 ? path.slice(lastSlashIndex + 1) : path;
  const lastDotIndex = filename ? filename.lastIndexOf('.') : -1;
  const basename =
    filename && lastDotIndex > 0 ? filename.slice(0, lastDotIndex) : filename;

  if (basename && basename.length > 0) {
    return `${basename}_mapping_${date}.txt`;
  } else {
    return `mapping_${date}.txt`;
  }
}
