/* eslint unicorn/no-array-callback-reference: 0 */

import { createSelector } from '@reduxjs/toolkit';
import turfContains from '@turf/boolean-contains';
import formatISO9075 from 'date-fns/formatISO9075';
import fromUnixTime from 'date-fns/fromUnixTime';
import identity from 'lodash-es/identity';
import isNil from 'lodash-es/isNil';
import max from 'lodash-es/max';
import { createCachedSelector } from 're-reselect';

import { CommonClockId } from '~/features/clocks/types';
import {
  getGeofencePolygonInWorldCoordinates,
  selectMissionIndex,
} from '~/features/mission/selectors';
import {
  formatDistance,
  formatDuration,
  formatDurationHMS,
} from '~/utils/formatting';
import { FlatEarthCoordinateSystem } from '~/utils/geography';
import {
  convexHull2D,
  createGeometryFromPoints,
  getCentroid,
} from '~/utils/math';
import { findNearestNeighborsDistance } from '~/utils/nearestNeighbors';

import {
  getConvexHullOfTrajectory,
  getDurationOfTrajectory,
  getFirstPointOfTrajectory,
  getLastPointOfTrajectory,
  getMaximumHeightOfTrajectory,
  getMaximumHorizontalDistanceFromTakeoffPositionInTrajectory,
  getPointsOfTrajectory,
  isValidTrajectory,
} from '../trajectory';
import { makeSegmentSelectors, transformPoints } from './trajectory';

import {
  didLastLoadingAttemptFail,
  getMinimumTakeoffSpacing,
  getNumberOfDronesInShow,
  getOutdoorShowCoordinateSystem,
  getShowClockReference,
  getShowSegments,
  getShowStartTime,
  getSwarmSpecification,
  getTrajectories,
  hasLoadedShowFile,
  isLoadingShowFile,
  isShowIndoor,
  isShowUsingYawControl,
} from './core';

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
  (convexHulls) => convexHull2D(convexHulls.flat())
);

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
 * Returns the maximum distance of any point in any of the trajectories from the
 * starting point of that trajectory.
 */
export const getMaximumHorizontalDistanceFromTakeoffPositionInTrajectories =
  createSelector(getTrajectories, (trajectories) =>
    max(
      trajectories.map(
        getMaximumHorizontalDistanceFromTakeoffPositionInTrajectory
      )
    )
  );

/**
 * Returns the maximum height observed in any of the trajectories, in the
 * show coordinate system.
 */
export const getMaximumHeightInTrajectories = createSelector(
  getTrajectories,
  (trajectories) => max(trajectories.map(getMaximumHeightOfTrajectory))
);

/**
 * Returns the total duration of the show, in seconds.
 */
export const getShowDuration = createSelector(getTrajectories, (trajectories) =>
  max(trajectories.map(getDurationOfTrajectory))
);

/**
 * Returns the total duration of the show, as a human-readable string.
 */
export const getShowDurationAsString = createSelector(
  getShowDuration,
  formatDuration
);

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
      return (
        geofence.isOk() &&
        convexHull.isOk() &&
        turfContains(geofence.value, convexHull.value)
      );
    }

    return false;
  }
);

/**
 * Returns the minimum distance between any two points at the beginning of the
 * trajectories. This can be used to ensure that takeoff positions are not too
 * close to each other.
 *
 * The result of this selector is infinite if there are less than two
 * trajectories.
 */
export const getMinimumDistanceBetweenTakeoffPositions = createSelector(
  getFirstPointsOfTrajectories,
  findNearestNeighborsDistance
);

/**
 * Returns the minimum distance between any two points at the end of the
 * trajectories. This can be used to ensure that landing positions are not too
 * close to each other.
 *
 * The result of this selector is infinite if there are less than two
 * trajectories.
 */
export const getMinimumDistanceBetweenLandingPositions = createSelector(
  getLastPointsOfTrajectories,
  findNearestNeighborsDistance
);

const getMinimumLandingSpacing = getMinimumTakeoffSpacing;

/**
 * Returns whether the takeoff positions are far enough to be considered safe.
 */
export const areTakeoffPositionsFarEnough = createSelector(
  getMinimumDistanceBetweenTakeoffPositions,
  getMinimumTakeoffSpacing,
  (minDist, threshold) => minDist >= threshold
);

/**
 * Returns whether the landing positions are far enough to be considered safe.
 */
export const areLandingPositionsFarEnough = createSelector(
  getMinimumDistanceBetweenLandingPositions,
  getMinimumLandingSpacing,
  (minDist, threshold) => minDist >= threshold
);

/**
 * Returns a string that encodes whether the show is currently loaded and has
 * passed some basic validation checks.
 */
export const getShowValidationResult = (state) => {
  if (didLastLoadingAttemptFail(state)) {
    return 'loadingFailed';
  }

  if (isLoadingShowFile(state)) {
    return 'loading';
  }

  if (!hasLoadedShowFile(state)) {
    return 'notLoaded';
  }

  if (!areTakeoffPositionsFarEnough(state)) {
    return 'takeoffPositionsTooClose';
  }

  if (!areLandingPositionsFarEnough(state)) {
    return 'landingPositionsTooClose';
  }

  return 'ok';
};

/**
 * Returns a suitable short one-line description for the current show file.
 */
export const getShowDescription = createSelector(
  getNumberOfDronesInShow,
  getShowDuration,
  getMaximumHeightInTrajectories,
  getMinimumDistanceBetweenTakeoffPositions,
  isShowUsingYawControl,
  // eslint-disable-next-line max-params
  (numberDrones, duration, maxHeight, spacing, hasYawControl) =>
    [
      `${numberDrones} drones`,
      ...(isNil(duration) ? [] : [formatDuration(duration)]),
      ...(isNil(maxHeight) ? [] : [`max AHL ${formatDistance(maxHeight, 1)}`]),
      ...(spacing > 0 && Number.isFinite(spacing)
        ? [`spacing ${formatDistance(Math.round(spacing * 100) / 100, 1)}`]
        : []),
      ...(hasYawControl ? ['yaw controlled'] : []),
    ].join(', ')
);

export const {
  getShowSegment,
  getSwarmSpecificationForShowSegment,
  getShowSegmentTrajectories,
  getConvexHullsOfShowSegmentTrajectories,
  getConvexHullOfShowSegment,
  getConvexHullOfShowSegmentInWorldCoordinates,
} = makeSegmentSelectors(
  getSwarmSpecification,
  getShowSegments,
  getOutdoorShowToWorldCoordinateSystemTransformation
);
