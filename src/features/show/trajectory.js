import maxBy from 'lodash-es/maxBy';
import { convexHull, euclideanDistance2D } from '~/utils/math';

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
 * Returns the maximum distance of any point in a trajectory from its starting
 * point. Returns 0 for empty trajectories.
 */
export function getMaximumHorizontalDistanceFromTakeoffPositionInTrajectory(
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
 * Returns the maximum height in a single trajectory. Returns 0 for empty
 * trajectories.
 */
export function getMaximumHeightOfTrajectory(trajectory) {
  if (!isValidTrajectory(trajectory)) {
    return undefined;
  }

  const { points = [] } = trajectory;
  const highestPoint = maxBy(points, (point) => point[1][2]);
  return highestPoint ? highestPoint[1][2] : 0;
}

/**
 * Returns the raw points of a trajectory objects, without their timestamps,
 * but optionally including control points in the right order.
 */
export function getPointsOfTrajectory(
  trajectory,
  { includeControlPoints = false } = {}
) {
  if (!isValidTrajectory(trajectory)) {
    return [];
  }

  const { points = [] } = trajectory;

  if (includeControlPoints) {
    const result = [];

    for (const item of points) {
      if (item.length > 2 && Array.isArray(item[2])) {
        result.push(...item[2]);
      }

      result.push(item[1]);
    }

    return result;
  }

  return points.map((point) => point[1]);
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
  Array.isArray(trajectory.points) &&
  trajectory.points.length > 0;
