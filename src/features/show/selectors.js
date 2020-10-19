import formatISO9075 from 'date-fns/formatISO9075';
import fromUnixTime from 'date-fns/fromUnixTime';
import get from 'lodash-es/get';
import isNil from 'lodash-es/isNil';
import max from 'lodash-es/max';
import maxBy from 'lodash-es/maxBy';

import { createSelector } from '@reduxjs/toolkit';

import {
  proposeDistanceLimit,
  proposeHeightLimit,
} from '~/features/geofence/utils';
import { formatDuration } from '~/utils/formatting';
import { FlatEarthCoordinateSystem } from '~/utils/geography';
import { convexHull } from '~/utils/math';

import {
  getConvexHullOfTrajectory,
  getFirstPointOfTrajectory,
  getLastPointOfTrajectory,
  getMaximumHeightOfTrajectory,
  getTrajectoryDuration,
  isValidTrajectory,
} from './trajectory';

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
export const hasScheduledStartTime = (state) => !isNil(state.show.start.time);

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
  return typeof result === 'object' ? result : {};
};

/**
 * Returns the specification of the drone swarm in the currently loaded show.
 */
export const getDroneSwarmSpecification = (state) => {
  const result = get(state, 'show.data.swarm.drones');
  return Array.isArray(result) ? result : [];
};

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
 * Selector that returns an object that can be used to transform GPS coordinates
 * from/to the show coordinate system.
 */
export const getShowCoordinateSystemTransformationObject = createSelector(
  getOutdoorShowCoordinateSystem,
  (coordinateSystem) =>
    coordinateSystem.origin
      ? new FlatEarthCoordinateSystem(coordinateSystem)
      : undefined
);

/**
 * Selector that returns a function that can be invoked with show coordinate
 * XYZ triplets and that returns the corresponding world coordinates.
 */
export const getShowToWorldCoordinateSystemTransformation = createSelector(
  getShowCoordinateSystemTransformationObject,
  (transform) =>
    transform
      ? (point) => {
          const [x, y, z] = point;
          const [lon, lat] = transform.toLonLat([x, y]);
          return { lon, lat, amsl: undefined, agl: z };
        }
      : undefined
);

/**
 * Selector that returns the type of the show (indoor or outdoor).
 */
export const getShowEnvironmentType = (state) => state.show.environment.type;

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
 * Returns the number of drones in the currently loaded show.
 */
export const getNumberOfDronesInShow = createSelector(
  getDroneSwarmSpecification,
  (swarm) => swarm.length
);

/**
 * Returns the orientation of the positive X axis of the show coordinate system,
 * irrespectively of whether this is an indoor or an outdoor show.
 */
export const getShowOrientation = createSelector(
  getShowEnvironmentType,
  getIndoorShowOrientation,
  getOutdoorShowOrientation,
  (type, indoorOrientation, outdoorOrientation) =>
    type === 'indoor' ? indoorOrientation : outdoorOrientation
);

/**
 * Returns an array containing all the trajectories. The array will contain
 * undefined for all the drones that have no fixed trajectories in the mission.
 */
const getTrajectories = createSelector(getDroneSwarmSpecification, (swarm) =>
  swarm.map((drone) => {
    const trajectory = get(drone, 'settings.trajectory');
    return isValidTrajectory(trajectory) ? trajectory : undefined;
  })
);

/**
 * Returns an array holding the convex hulls of all the trajectories.
 */
export const getConvexHullsOfTrajectories = createSelector(
  getTrajectories,
  (trajectories) => trajectories.map(getConvexHullOfTrajectory)
);

/**
 * Returns the coordinates of the convex hull of the currently loaded show.
 */
export const getConvexHullOfShow = createSelector(
  getConvexHullsOfTrajectories,
  (convexHulls) => {
    const allPoints = [].concat(...convexHulls);
    return convexHull(allPoints);
  }
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

export const getFirstPointsOfTrajectoriesInWorldCoordinates = createSelector(
  getFirstPointsOfTrajectories,
  getShowToWorldCoordinateSystemTransformation,
  (points, transform) =>
    transform ? points.map(transform) : new Array(points.length).fill(undefined)
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

export const getLastPointsOfTrajectoriesInWorldCoordinates = createSelector(
  getLastPointsOfTrajectories,
  getShowToWorldCoordinateSystemTransformation,
  (points, transform) =>
    transform ? points.map(transform) : new Array(points.length).fill(undefined)
);

/**
 * Returns the maximum distance of any point in a trajectory from its starting
 * point. Returns 0 for empty trajectories.
 */
function getMaximumHorizontalDistanceFromTakeoffPositionInTrajectory(
  trajectory
) {
  const { points = [] } = trajectory;
  if (points.length === 0) {
    return 0;
  }

  // TODO(ntamas): calculate distances only for the convex hull of the trajectory!

  const firstKeyframe = points[0];
  const firstPoint = firstKeyframe[1];

  const distanceToFirstPoint = (keyframe) => {
    const point = keyframe[1];
    return Math.hypot(point[0] - firstPoint[0], point[1] - firstPoint[1]);
  };

  const farthestPoint = maxBy(points, distanceToFirstPoint);
  return farthestPoint ? distanceToFirstPoint(farthestPoint) : 0;
}

/**
 * Returns the maximum distance of any point in any of the trajectories from the
 * starting point of that trajectory.
 */
export const getMaximumHorizontalDistanceFromTakeoffPositionInTrajectories = createSelector(
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
  const maxHeight = getMaximumHorizontalDistanceFromTakeoffPositionInTrajectories(
    state
  );
  const margin = get(state, 'dialogs.geofenceSettings.horizontalMargin');
  return proposeDistanceLimit(maxHeight, margin);
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
  (numberDrones, duration) => `${numberDrones} drones, ${duration}`
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
 * Returns the metadata of the show, if any.
 */
export const getShowMetadata = createSelector(
  (state) => state.show.data,
  (data) => (data && typeof data.meta === 'object' ? data.meta : null) || {}
);

/**
 * Returns the scheduled start time of the show as a string. Returns undefined
 * if no start time is set.
 */
export const getShowStartTimeAsString = createSelector(
  (state) => state.show.start.time,
  (time) =>
    isNil(time) || Number.isNaN(time)
      ? undefined
      : formatISO9075(fromUnixTime(time))
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
 * Returns the failed upload items from the uploader.
 */
export const getFailedUploadItems = (state) => state.show.upload.failedItems;

/**
 * Returns the upload items that are currently in the backlog of the uploader:
 * the ones that are waiting to be started and the ones that have been queued
 * inside the uploader saga but have not been taken up by a worker yet.
 */
export const getItemsInUploadBacklog = createSelector(
  (state) => state.show.upload.itemsQueued,
  (state) => state.show.upload.itemsWaitingToStart,
  (queued, waiting) => [...queued, ...waiting]
);

/**
 * Returns the ID of the next drone from the upload queue during an upload
 * process, or undefined if the queue is empty.
 */
export const getNextDroneFromUploadQueue = (state) => {
  const { itemsWaitingToStart } = state.show.upload;
  if (itemsWaitingToStart && itemsWaitingToStart.length > 0) {
    return itemsWaitingToStart[0];
  }

  return undefined;
};

/**
 * Returns a summary of the progress of the upload process in the form of
 * two numbers. The first is a percentage of items for which the upload has
 * either finished successfully or has failed. The second is a percentage of
 * items for which the upload has finished successfully, is in progress or
 * has failed.
 */
export const getUploadProgress = createSelector(
  (state) => state.show.upload,
  ({
    failedItems,
    itemsFinished,
    itemsInProgress,
    itemsQueued,
    itemsWaitingToStart,
  }) => {
    const numberFailedItems = Array.isArray(failedItems)
      ? failedItems.length
      : 0;
    const numberItemsFinished = Array.isArray(itemsFinished)
      ? itemsFinished.length
      : 0;
    const numberItemsInProgress = Array.isArray(itemsInProgress)
      ? itemsInProgress.length
      : 0;
    const numberItemsQueued = Array.isArray(itemsQueued)
      ? itemsQueued.length
      : 0;
    const numberItemsWaitingToStart = Array.isArray(itemsWaitingToStart)
      ? itemsWaitingToStart.length
      : 0;

    const total =
      numberFailedItems +
      numberItemsInProgress +
      numberItemsQueued +
      numberItemsWaitingToStart +
      numberItemsFinished;
    if (total > 0) {
      const number1 = numberItemsFinished;
      const number2 = number1 + numberItemsInProgress;
      return [
        Math.round((100 * number1) / total),
        Math.round((100 * number2) / total),
      ];
    }

    return [0, 0];
  }
);

/**
 * Returns whether we are currently uploading show data to the drones.
 */
export const isUploadInProgress = (state) => state.show.upload.running;

/**
 * Returns whether failed uploads should be retried automatically.
 */
export const shouldRetryFailedUploadsAutomatically = (state) =>
  state.show.upload.autoRetry;
