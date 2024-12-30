import max from 'lodash-es/max';

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
    ? trajectory.points.at(-1)[1]
    : undefined;
}

/**
 * Returns the maximum distance of any point in a trajectory from its starting
 * point.
 */
export function getMaximumHorizontalDistanceFromTakeoffPositionInTrajectory(
  trajectory
) {
  if (!isValidTrajectory(trajectory)) {
    return;
  }

  // TODO: `isValidTrajectory` already ensures `points.length > 0`...
  const { points = [] } = trajectory;
  if (points.length === 0) {
    return;
  }

  // TODO(ntamas): calculate distances only for the convex hull of the trajectory!

  const firstKeyframe = points[0];
  const firstPoint = firstKeyframe[1];

  const distanceToFirstPoint = (keyframe) => {
    const point = keyframe[1];
    return euclideanDistance2D(point, firstPoint);
  };

  return max(trajectory.points.map(distanceToFirstPoint));
}

/**
 * Returns the maximum height in a single trajectory.
 */
export function getMaximumHeightOfTrajectory(trajectory) {
  if (!isValidTrajectory(trajectory)) {
    return;
  }

  return max(
    trajectory.points.map(([_timestamp, coordinates]) => coordinates[2])
  );
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
export function getDurationOfTrajectory(trajectory) {
  if (!isValidTrajectory(trajectory)) {
    return;
  }

  const { points, takeoffTime } = trajectory;

  // TODO: `isValidTrajectory` already ensures `points.length > 0`...
  if (points.length > 0) {
    const lastPoint = points.at(-1);
    if (Array.isArray(lastPoint) && lastPoint.length > 1) {
      return lastPoint[0] + (takeoffTime ?? 0);
    }
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
