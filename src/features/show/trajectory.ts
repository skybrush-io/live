import isObject from 'lodash-es/isObject';
import max from 'lodash-es/max';

import { type Trajectory, type TrajectorySegment } from '@skybrush/show-format';

import {
  convexHull2D,
  type Coordinate2D,
  type Coordinate3D,
  euclideanDistance2D,
} from '~/utils/math';

const vector3Dto2D: (c: Coordinate3D) => Coordinate2D = ([x, y, _z]) => [x, y];

/**
 * Returns the convex hull of a single drone trajectory.
 */
export const getConvexHullOfTrajectory = (
  trajectory: Trajectory
): Coordinate2D[] =>
  convexHull2D(getPointsOfTrajectory(trajectory).map(vector3Dto2D));

/**
 * Returns the first point of a single drone trajectory.
 */
export const getFirstPointOfTrajectory = (
  trajectory: Trajectory
): Coordinate3D | undefined =>
  // NOTE: Bang justified by `isValidTrajectory` => `points.length > 0`
  isValidTrajectory(trajectory) ? trajectory.points.at(0)![1] : undefined;

/**
 * Returns the last point of a single drone trajectory.
 */
export const getLastPointOfTrajectory = (
  trajectory: Trajectory
): Coordinate3D | undefined =>
  // NOTE: Bang justified by `isValidTrajectory` => `points.length > 0`
  isValidTrajectory(trajectory) ? trajectory.points.at(-1)![1] : undefined;

/**
 * Returns the maximum distance of any point in a trajectory from its starting
 * point.
 */
export const getMaximumHorizontalDistanceFromTakeoffPositionInTrajectory = (
  trajectory: Trajectory
): number | undefined => {
  if (!isValidTrajectory(trajectory)) {
    return;
  }

  // TODO: `isValidTrajectory` already ensures `points.length > 0`...
  const { points = [] } = trajectory;
  if (points.length === 0) {
    return;
  }

  // TODO(ntamas): calculate distances only for the convex hull of the trajectory!

  const firstKeyframe = points[0]!;
  const firstPoint = firstKeyframe[1];

  const distanceToFirstPoint = (keyframe: TrajectorySegment): number => {
    const point = keyframe[1];
    return euclideanDistance2D(vector3Dto2D(point), vector3Dto2D(firstPoint));
  };

  return max(trajectory.points.map(distanceToFirstPoint));
};

/**
 * Returns the maximum height in a single trajectory.
 */
export const getMaximumHeightOfTrajectory = (
  trajectory: Trajectory
): number | undefined => {
  if (!isValidTrajectory(trajectory)) {
    return;
  }

  return max(
    trajectory.points.map(([_timestamp, coordinates]) => coordinates[2])
  );
};

/**
 * Returns the raw points of a trajectory objects, without their timestamps,
 * but optionally including control points in the right order.
 */
export const getPointsOfTrajectory = (
  trajectory: Trajectory,
  { includeControlPoints = false } = {}
): Coordinate3D[] => {
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
};

/**
 * Returns the duration of a single drone trajectory, in seconds.
 */
export const getDurationOfTrajectory = (
  trajectory: Trajectory
): number | undefined => {
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
};

/**
 * Returns whether a trajectory object "looks like" a valid trajectory.
 *
 * TODO: Add validation for the optional `takeoffTime` and `landingTime` fields
 *       Also, maybe this function should be in `@skybrush/show-format` instead
 */
export const isValidTrajectory = (
  trajectory: unknown
): trajectory is Trajectory =>
  // prettier-ignore
  isObject(trajectory)
  // `version` is valid
  && 'version' in trajectory
  && trajectory.version === 1
  // `points` is a valid, non-empty array
  && 'points' in trajectory
  && Array.isArray(trajectory.points)
  && trajectory.points.length > 0;
