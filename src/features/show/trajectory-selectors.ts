import { createSelector } from 'reselect';

import type {
  DroneSpecification,
  ShowSegment,
  ShowSegmentId,
  SwarmSpecification,
  TimeWindow,
} from '@skybrush/show-format';

import { type GPSPosition } from '~/model/geography';
import { type AppSelector } from '~/store/reducers';
import { FlatEarthCoordinateSystem } from '~/utils/geography';
import {
  convexHull2D,
  type Coordinate2DPlus,
  type Coordinate3D,
} from '~/utils/math';
import { EMPTY_ARRAY } from '~/utils/redux';

import {
  getConvexHullOfTrajectory,
  getTrajectoryInTimeWindow,
  isValidTrajectory,
} from './trajectory';
import {
  isOutdoorCoordinateSystemWithOrigin,
  type OutdoorCoordinateSystem,
} from './types';

export type CoordinateToWorldTransformationFunction = <
  TCoord extends Coordinate2DPlus,
>(
  point: TCoord
) => GPSPosition;

/**
 * Transforms the given coordinates using the given transformation function.
 */
export const transformPoints = <TCoord extends Coordinate2DPlus, TTransformed>(
  points: TCoord[],
  transform: ((point: TCoord) => TTransformed) | undefined
) => (transform ? points.map(transform) : []);

/**
 * Redux combiner that applies the given world coordinate transformation to every
 * received coordinate. If any of the coordinates is `undefined`, the combiner will
 * return `undefined`.
 *
 * @param coords The coordinates to transform.
 * @param transform The coordinate transformation function.
 *
 * @returns `undefined` if any of the coordinates is `undefined`, otherwise the
 *          transformed coordinates.
 */
export const positionsToWorldCoordinatesCombiner = (
  coords: Array<Coordinate2DPlus | undefined>,
  transform: CoordinateToWorldTransformationFunction | undefined
) => {
  if (coords.includes(undefined)) {
    // Return undefined if the home position of at least one drone is not known.
    // We can probably relax this criteria later.
    return undefined;
  }

  // No undefined in the list, so we can type cast here.
  return transformPoints(coords as Coordinate3D[], transform);
};

export function makeSelectors(
  selectSwarm: AppSelector<SwarmSpecification | undefined>,
  selectOutdoorShowCoordinateSystem: AppSelector<OutdoorCoordinateSystem>
) {
  // === Base selectors ===

  /**
   * Returns the specification of the drone swarm in the currently loaded show.
   */
  const getDroneSpecifications = createSelector(selectSwarm, (swarm) => {
    const result = swarm?.drones;
    return Array.isArray(result) ? result : EMPTY_ARRAY;
  });

  /**
   * Returns an array containing all the trajectories. The array will contain
   * undefined for all the drones that have no fixed trajectories in the mission.
   */
  const getTrajectories = createSelector(getDroneSpecifications, (swarm) =>
    swarm.map((drone) => {
      const trajectory = drone.settings?.trajectory;
      return trajectory !== undefined && isValidTrajectory(trajectory)
        ? trajectory
        : undefined;
    })
  );

  // === Coordinate transformation ===

  /**
   * Selector that returns an object that can be used to transform GPS coordinates
   * from/to the show coordinate system.
   */
  const getOutdoorShowToWorldCoordinateSystemTransformationObject =
    createSelector(selectOutdoorShowCoordinateSystem, (coordinateSystem) =>
      isOutdoorCoordinateSystemWithOrigin(coordinateSystem)
        ? new FlatEarthCoordinateSystem(coordinateSystem)
        : undefined
    );

  /**
   * Selector that returns a function that can be invoked with show coordinate
   * XYZ triplets and that returns the corresponding world coordinates.
   */
  const getOutdoorShowToWorldCoordinateSystemTransformation = createSelector(
    getOutdoorShowToWorldCoordinateSystemTransformationObject,
    (transform) => {
      if (transform === undefined) {
        return undefined;
      }

      return <TCoord extends Coordinate2DPlus>(point: TCoord): GPSPosition => {
        const [x, y, z] = point;
        const [lon, lat] = transform.toLonLat([x, y]);
        return { lon, lat, amsl: undefined, ahl: z };
      };
    }
  );

  // === Home position selectors ===

  /**
   * Selector that returns the home positions of all drones (if they have one).
   */
  const getHomePositions = createSelector(getDroneSpecifications, (drones) => {
    return drones.map((drone) => drone.settings?.home);
  });

  /**
   * Selector that returns the home positions of all drones in world coordinates.
   *
   * If any of the drones does not have a home position, undefined is returned.
   */
  const getHomePositionsInWorldCoordinates = createSelector(
    getHomePositions,
    getOutdoorShowToWorldCoordinateSystemTransformation,
    positionsToWorldCoordinatesCombiner
  );

  // === Landing position selectors ===

  /**
   * Selector that returns the landing positions of all drones (if they have one).
   */
  const getLandingPositions = createSelector(
    getDroneSpecifications,
    (drones) => {
      return drones.map((drone) => drone.settings?.landAt);
    }
  );

  /**
   * Selector that returns the landing positions of all drones in world coordinates.
   *
   * If any of the drones does not have a landing position, undefined is returned.
   */
  const getLandingPositionsInWorldCoordinates = createSelector(
    getLandingPositions,
    getOutdoorShowToWorldCoordinateSystemTransformation,
    positionsToWorldCoordinatesCombiner
  );

  // === Convex hull selectors ===

  /**
   * Returns an array holding the convex hulls of all the trajectories.
   */
  const getConvexHullsOfTrajectories = createSelector(
    getTrajectories,
    (trajectories) =>
      trajectories.filter((t) => t !== undefined).map(getConvexHullOfTrajectory)
  );

  /**
   * Returns the coordinates of the convex hull of the currently loaded show.
   * These are in the flat Earth coordinate system of the show so they are not
   * usable directly on the map. Use `getConvexHullOfShowInWorldCoordinates()` if
   * you need them as GPS coordinates.
   */
  const getConvexHullOfShow = createSelector(
    getConvexHullsOfTrajectories,
    (convexHulls) => convexHull2D(convexHulls.flat())
  );

  /**
   * Returns the coordinates of the convex hull of the currently loaded show, in
   * world coordinates.
   */
  const getConvexHullOfShowInWorldCoordinates = createSelector(
    getConvexHullOfShow,
    getOutdoorShowToWorldCoordinateSystemTransformation,
    (convexHull, transformation) => transformPoints(convexHull, transformation)
  );

  return {
    getDroneSpecifications,
    getHomePositions,
    getHomePositionsInWorldCoordinates,
    getLandingPositionsInWorldCoordinates,
    getConvexHullsOfTrajectories,
    getConvexHullOfShow,
    getConvexHullOfShowInWorldCoordinates,
    getOutdoorShowToWorldCoordinateSystemTransformation,
  };
}

/**
 * Creates various show segment-related selectors, built on top of the given base selectors.
 *
 * @param selectShowSegments Selector that returns the known show segments.
 * @param selectTrajetories Selector that returns the *full* trajectories of all drones. The should
 *        return `undefined` for drones that do not have a trajectory in the show.
 * @param selectOutdoorShowToWorldCoordinateSystemTransformation Selector that returns a function
 *        that transforms a point from show coordinates to the corresponding world coordinates.
 *
 */
export function makeSegmentSelectors(
  selectSwarm: AppSelector<SwarmSpecification>,
  selectShowSegments: AppSelector<
    Record<ShowSegmentId, ShowSegment> | undefined
  >,
  selectOutdoorShowToWorldCoordinateSystemTransformation: AppSelector<
    | (<TCoord extends Coordinate2DPlus>(point: TCoord) => GPSPosition)
    | undefined
  >
) {
  /**
   * Returns the specification of the drone swarm in the currently loaded show.
   */
  const getDroneSpecifications = createSelector(selectSwarm, (swarm) => {
    const result = swarm?.drones;
    return Array.isArray(result) ? result : EMPTY_ARRAY;
  });

  /**
   * Returns an array containing all the trajectories. The array will contain
   * undefined for all the drones that have no fixed trajectories in the mission.
   */
  const getTrajectories = createSelector(getDroneSpecifications, (swarm) =>
    swarm.map((drone) => {
      const trajectory = drone.settings?.trajectory;
      return trajectory !== undefined && isValidTrajectory(trajectory)
        ? trajectory
        : undefined;
    })
  );

  /**
   * Creates a show segment selector for the segment with the given ID.
   */
  const makeSegmentSelector = (segmentId: ShowSegmentId) =>
    createSelector(selectShowSegments, (segments) => {
      const result = segments?.[segmentId];
      if (result === undefined) {
        return undefined;
      }

      // Not full validation, but should be enough here.
      return Array.isArray(result) && result.length === 2 ? result : undefined;
    });

  /**
   * Returns the `[start, end]` timestamp pair for the `"show"` segment
   * if the segment exists, otherwise returns `undefined`.
   */
  const getShowSegment = makeSegmentSelector('show');

  /**
   * Creates a selector that calculates a swarm specification for the show segment
   * with the given ID i the segment exists. Otherwise `undefined` is returned.
   */
  const makeSwarmSpecificationSelectorForSegment = (segmentId: ShowSegmentId) =>
    createSelector(
      makeSegmentSelector(segmentId),
      selectSwarm,
      (segment, swarm): SwarmSpecification | undefined => {
        if (segment === undefined) {
          return undefined;
        }

        const timeWindow: TimeWindow = {
          startTime: segment[0],
          duration: segment[1] - segment[0],
        };

        const drones = swarm.drones.map((drone): DroneSpecification => {
          const settings = drone.settings;
          if (settings === undefined) {
            return drone;
          }

          // TODO(vp): what about lights and yawControl?
          const trajectory = getTrajectoryInTimeWindow(
            settings.trajectory,
            timeWindow
          );
          return { ...drone, settings: { ...drone.settings, trajectory } };
        });

        return { ...swarm, drones };
      }
    );

  /**
   * Creates a selector that returns the trajectories of all drones in
   * the segment with the given ID if the segment exists. Otherwise
   * `undefined` is returned.
   *
   * The returned array of trajectories contains `undefined` for all the drones
   * that have no fixed trajectory.
   */
  const makeTrajectoriesSelectorForSegment = (segmentId: ShowSegmentId) =>
    createSelector(
      makeSegmentSelector(segmentId),
      getTrajectories,
      (segment, trajectories) => {
        if (segment === undefined) {
          return undefined;
        }

        const timeWindow: TimeWindow = {
          startTime: segment[0],
          duration: segment[1] - segment[0],
        };

        return trajectories.map((trajectory) =>
          trajectory === undefined
            ? undefined
            : getTrajectoryInTimeWindow(trajectory, timeWindow)
        );
      }
    );

  /**
   * Selector that returns an entire swarm specification for the "show" segment if
   * it exists, otherwise returns `undefined`.
   */
  const getSwarmSpecificationForShowSegment =
    makeSwarmSpecificationSelectorForSegment('show');

  /**
   * Selector that returns the subtrajectories of all drones for the "show" segment
   * if it exists, otherwise returns `undefined`.
   */
  const getShowSegmentTrajectories = makeTrajectoriesSelectorForSegment('show');

  /**
   * Returns an array holding the convex hulls of all "show" segment trajectories.
   */
  const getConvexHullsOfShowSegmentTrajectories = createSelector(
    getShowSegmentTrajectories,
    (trajectories) =>
      (trajectories ?? [])
        .filter((v) => v !== undefined)
        .map(getConvexHullOfTrajectory)
  );

  /**
   * Returns the coordinates of the convex hull of the "show" segment of the currently
   * loaded show.
   *
   * These are in the flat Earth coordinate system of the show so they are not
   * usable directly on the map. Use `getConvexHullOfShowSegmentInWorldCoordinates()`
   * if you need them as GPS coordinates.
   */
  const getConvexHullOfShowSegment = createSelector(
    getConvexHullsOfShowSegmentTrajectories,
    (convexHulls) => convexHull2D(convexHulls.flat())
  );

  /**
   * Returns the coordinates of the convex hull of the "show" segment of thenpm
   * currently loaded show, in world coordinates, or `undefined` if the "show"
   * segment does not exist.
   */
  const getConvexHullOfShowSegmentInWorldCoordinates = createSelector(
    getConvexHullOfShowSegment,
    selectOutdoorShowToWorldCoordinateSystemTransformation,
    transformPoints
  );

  return {
    getShowSegment,
    getSwarmSpecificationForShowSegment,
    getShowSegmentTrajectories,
    getConvexHullsOfShowSegmentTrajectories,
    getConvexHullOfShowSegment,
    getConvexHullOfShowSegmentInWorldCoordinates,
  };
}
