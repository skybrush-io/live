import max from 'lodash-es/max';

import { convexHull2D, euclideanDistance2D } from '@skybrush/math';
import {
  getTrajectorySegmentsInTimeWindow,
  isValidTrajectory,
  type TimeWindow,
  type Trajectory,
  type TrajectorySegment,
} from '@skybrush/show-format';

import type { Coordinate2D, Coordinate3D } from '~/utils/math';

const vector3Dto2D: (c: Coordinate3D) => Coordinate2D = ([x, y, _z]) => [x, y];

/**
 * Returns the convex hull of a single drone trajectory.
 */
export const getConvexHullOfTrajectory = (
  trajectory: Trajectory
): Coordinate2D[] =>
  convexHull2D(
    getPointsOfTrajectory(trajectory, { includeControlPoints: true }).map(
      vector3Dto2D
    )
  );

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
 * Returns the subtrajectory of the given trajectory that is within the given time window.
 *
 * The function keeps the all the properties of the original trajectory, but replaces
 * the `points` property with calculated subtrajectory.
 *
 * @param trajectory The trajectory to get the subtrajectory from.
 * @param timeWindow The time window of the subtrajectory.
 */
export function getTrajectoryInTimeWindow(
  trajectory: Trajectory,
  timeWindow: TimeWindow
): Trajectory {
  return {
    ...trajectory,
    points: getTrajectorySegmentsInTimeWindow(
      trajectory.points,
      timeWindow
      // TODO: Get rid of this type assertion! It only holds if the given
      //       `timeWindow` is guaranteed to contain segments, which is not
      //       actually enforced by the schema.
    ) as Trajectory['points'],
  };
}
