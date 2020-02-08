import get from 'lodash-es/get';
import moment from 'moment';
import { createSelector } from '@reduxjs/toolkit';

/**
 * Returns whether the manual preflight checks are signed off (i.e. approved)
 * by the operator.
 */
export const areManualPreflightChecksSignedOff = state =>
  Boolean(state.show.preflight.manualChecksSignedOffAt);

/**
 * Returns whether the onboard preflight checks are signed off (i.e. approved)
 * by the operator.
 */
export const areOnboardPreflightChecksSignedOff = state =>
  Boolean(state.show.preflight.onboardChecksSignedOffAt);

/**
 * Returns the specification of the drone swarm in the currently loaded show.
 */
export const getDroneSwarmSpecification = state => {
  const result = get(state, 'show.data.swarm.drones');
  return Array.isArray(result) ? result : [];
};

/**
 * Selector that returns the definition of the coordinate system of an outdoor
 * show.
 */
const getOutdoorShowCoordinateSystem = state =>
  state.show.environment.coordinateSystem;

/**
 * Selector that returns the orientation of the positive X axis of the show
 * coordinate system, cast into a float.
 *
 * This is needed because we store the orientation of the show coordinate
 * system as a string by default to avoid rounding errors, but most components
 * require a float instead.
 */
export const getOutdoorShowOrientation = createSelector(
  getOutdoorShowCoordinateSystem,
  coordinateSystem => parseFloat(coordinateSystem.orientation)
);

/**
 * Returns the number of drones in the currently loaded show.
 */
export const getNumberOfDronesInShow = createSelector(
  getDroneSwarmSpecification,
  swarm => swarm.length
);

/**
 * Returns the duration of a single drone trajectory.
 */
const getTrajectoryDuration = trajectory => {
  if (
    !trajectory ||
    typeof trajectory !== 'object' ||
    trajectory.version !== 1
  ) {
    return 0;
  }

  const { points } = trajectory;

  if (points && Array.isArray(points) && points.length > 0) {
    const lastPoint = points[points.length - 1];
    if (Array.isArray(lastPoint) && lastPoint.length > 1) {
      return lastPoint[0];
    }
  }

  return 0;
};

/**
 * Returns the total duration of the show, in seconds.
 */
export const getShowDuration = createSelector(
  getDroneSwarmSpecification,
  swarm => {
    let maxLength = 0;

    for (const drone of swarm) {
      if (typeof drone !== 'object') {
        continue;
      }

      const { settings } = drone;
      if (typeof settings !== 'object') {
        continue;
      }

      const { trajectory } = settings;
      maxLength = Math.max(maxLength, getTrajectoryDuration(trajectory));
    }

    return maxLength;
  }
);

/**
 * Returns the total duration of the show, as a human-readable string.
 */
export const getShowDurationAsString = createSelector(
  getShowDuration,
  duration =>
    moment.duration(duration, 'seconds').format('m:ss', { trim: false })
);

/**
 * Returns a suitable short one-line description for the current show file.
 */
export const getShowDescription = createSelector(
  getNumberOfDronesInShow,
  getShowDurationAsString,
  (numDrones, duration) => `${numDrones} drones, ${duration}`
);

/**
 * Returns the metadata of the show, if any.
 */
export const getShowMetadata = createSelector(
  state => state.show.data,
  data => (data && typeof data.meta === 'object' ? data.meta : null) || {}
);

/**
 * Returns a suitable title string for the current show file.
 */
export const getShowTitle = createSelector(
  getShowMetadata,
  getNumberOfDronesInShow,
  (meta, numDrones) => meta.title || `Show with ${numDrones} drones`
);

/**
 * Returns whether there is a show file currently loaded.
 */
export const hasLoadedShowFile = state => Boolean(state.show.data);

/**
 * Returns whether the origin of the coordinate system of the show has been
 * set up.
 */
export const hasShowOrigin = state =>
  Boolean(get(state, 'show.environment.outdoor.coordinateSystem.origin'));

/**
 * Returns whether we are currently loading a show file.
 */
export const isLoadingShowFile = state => state.show.loading;
