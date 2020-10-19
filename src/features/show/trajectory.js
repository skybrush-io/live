import maxBy from 'lodash-es/maxBy';
import { convexHull } from '~/utils/math';

/**
 * Returns the convex hull of a single drone trajectory.
 */
export function getConvexHullOfTrajectory(trajectory) {
  // Here we make use of the fact that convexHull() happily ignores the Z
  // coordinate
  return convexHull(getPointsOfTrajectory(trajectory));
}

/**
 * Returns the first point of a single drone trajectory.
 */
export function getFirstPointOfTrajectory(trajectory) {
  return isValidTrajectory(trajectory) ? trajectory.points[0][1] : undefined;
}

/**
 * Returns the last point of a single drone trajectory.
 */
export function getLastPointOfTrajectory(trajectory) {
  return isValidTrajectory(trajectory)
    ? trajectory.points[trajectory.points.length - 1][1]
    : undefined;
}

/**
 * Returns the maximum height in a single trajectory. Returns 0 for empty
 * trajectories.
 */
export function getMaximumHeightOfTrajectory(trajectory) {
  const { points = [] } = trajectory;
  const highestPoint = maxBy(points, (point) => point[1][2]);
  return highestPoint ? highestPoint[1][2] : 0;
}

/**
 * Returns the raw points of a trajectory objects, without their timestamps
 * or control points.
 */
export function getPointsOfTrajectory(trajectory) {
  const { points = [] } = trajectory;
  return isValidTrajectory(trajectory) ? points.map((point) => point[1]) : [];
}

/**
 * Returns the duration of a single drone trajectory.
 */
export function getTrajectoryDuration(trajectory) {
  if (!isValidTrajectory(trajectory)) {
    return 0;
  }

  const { points, takeoffTime } = trajectory;

  if (points.length > 0) {
    const lastPoint = points[points.length - 1];
    if (Array.isArray(lastPoint) && lastPoint.length > 1) {
      return lastPoint[0] + (takeoffTime || 0);
    }
  } else {
    return 0;
  }
}

/**
 * Returns whether a trajectory object "looks like" a valid trajectory.
 */
export const isValidTrajectory = (trajectory) =>
  typeof trajectory === 'object' &&
  trajectory.version === 1 &&
  typeof trajectory.points === 'object' &&
  Array.isArray(trajectory.points);
