import identity from 'lodash-es/identity';
import min from 'lodash-es/min';

import type { Point, LineString, Polygon } from 'geojson';
import * as TurfHelpers from '@turf/helpers';

import concaveman from 'concaveman';
// import simpliwhy from 'simpliwhy';
import monotoneConvexHull2D from 'monotone-convex-hull-2d';
import { err, ok, type Result } from 'neverthrow';

import type { EasNor, LonLat } from './geography';

// TODO: Rename `Coordinate{2,3}D` to `Vector{2,3}Tuple` for
//       consistency with Three.js and `@skybrush/show-format`
export type Coordinate2D = [number, number];
/**
 * Utility type for 2D coordinates with an arbitrary number of additional
 * dimensions. It is useful when a function ignores additional dimenstions
 * and we want to allow for example 3D coordinates as input without data
 * conversion or type errors.
 */
export type Coordinate2DPlus = [number, number, ...number[]];
export type Coordinate3D = [number, number, number];
export type Coordinate2DObject = { x: number; y: number };
export type PolarCoordinate2DObject = { angle: number; radius: number };

/**
 * Type guard for checking whether the input is a valid 2D coordinate pair.
 */
export const isCoordinate2D = (
  coordinate: unknown
): coordinate is Coordinate2D =>
  Array.isArray(coordinate) &&
  coordinate.length === 2 &&
  coordinate.every((c) => typeof c === 'number');

/**
 * Returns the given number of degrees in radians.
 *
 * @param x - The degrees to convert
 * @returns The converted degrees in radians
 */
export function toRadians(x: number): number {
  return (x * Math.PI) / 180;
}

export const degrees = toRadians;

/**
 * Returns the given number of radians in degrees.
 *
 * @param x - The radians to convert
 * @returns The converted radians in degrees
 */
export function toDegrees(x: number): number {
  return (x * 180) / Math.PI;
}

export const radians = toDegrees;

/**
 * Converts a center, an angle and a radius in polar coordinates into Cartesian
 * coordinates.
 *
 * The angle is assumed to be increasing counter-clockwise; zero points to the
 * East.
 *
 * @param center - The center coordinate at radius zero
 * @param angle - The angle
 * @param radius - The radius
 * @returns The Cartesian coordinates equivalent to the input polar coordinates
 */
export function polarCCW({
  center = [0, 0],
  angle,
  radius = 1,
}: {
  center?: Coordinate2D;
  angle: number;
  radius?: number;
}): Coordinate2D {
  const rad = toRadians(angle);
  return [
    center[0] + radius * Math.cos(rad),
    center[1] + radius * Math.sin(rad),
  ];
}

/**
 * Converts a center, an angle and a radius in polar coordinates into Cartesian
 * coordinates.
 *
 * The angle is assumed to be increasing clockwise; zero points to the East.
 *
 * @param center - The center coordinate at radius zero
 * @param angle - The angle
 * @param radius - The radius
 * @returns The Cartesian coordinates equivalent to the input polar coordinates
 */
export function polarCW({
  center = [0, 0],
  angle,
  radius = 1,
}: {
  center?: Coordinate2D;
  angle: number;
  radius?: number;
}): Coordinate2D {
  const rad = toRadians(-angle);
  return [
    center[0] + radius * Math.cos(rad),
    center[1] + radius * Math.sin(rad),
  ];
}

/**
 * Converts a center, an angle and a radius in polar coordinates into Cartesian
 * coordinates.
 *
 * The angle is assumed to be increasing clockwise; zero points to the North.
 *
 * @param center - The center coordinate at radius zero
 * @param angle - The angle
 * @param radius - The radius
 * @returns The Cartesian coordinates equivalent to the input polar coordinates
 */
export function polarCWNorth({
  center = [0, 0],
  angle,
  radius = 1,
}: {
  center?: Coordinate2D;
  angle: number;
  radius?: number;
}): number[] {
  const rad = toRadians(90 - angle);
  return [
    center[0] + radius * Math.cos(rad),
    center[1] + radius * Math.sin(rad),
  ];
}

export const polar = polarCCW;

/**
 * Converts a two dimensional vector to polar coordinates.
 */
export const toPolar = ({
  x,
  y,
}: Coordinate2DObject): PolarCoordinate2DObject => ({
  angle: Math.atan2(y, x),
  radius: Math.hypot(x, y),
});

/**
 * Returns the centroid of an array of points.
 */
export function getCentroid(points: LonLat[], dim?: 2): LonLat;
export function getCentroid(points: Coordinate2D[], dim?: 2): Coordinate2D;
export function getCentroid(points: number[][], dim = 2): number[] {
  const result: number[] = Array.from({ length: dim }, () => 0);
  const n = points && Array.isArray(points) ? points.length : 0;

  if (n === 0) {
    return result;
  }

  for (const point of points) {
    for (let i = 0; i < dim; i++) {
      result[i] = (result[i] ?? 0) + (point[i] ?? 0);
    }
  }

  for (let i = 0; i < dim; i++) {
    result[i] = (result[i] ?? 0) / n;
  }

  return result;
}

/**
 * Returns the mean angle of an array of angles, specified in degrees.
 */
export function getMeanAngle(angles: number[]): number {
  const centroid: Coordinate2D = [0, 0];
  for (const angle of angles.map(toRadians)) {
    centroid[0] += Math.cos(angle);
    centroid[1] += Math.sin(angle);
  }

  // Works with centroid = [0, 0] as Math.atan2(0, 0) is 0.
  const result = toDegrees(Math.atan2(centroid[1], centroid[0]));
  return result < 0 ? result + 360 : result;
}

export type DistanceCalculationOptions<T, U = Coordinate2D> = {
  distanceFunction: (a: U, b: U) => number;
  getter?: (item: T) => U;
};

/**
 * Create a distance matrix between two arrays.
 */
export function calculateDistanceMatrix<T, U = Coordinate2D>(
  sources: T[],
  targets: T[],
  { distanceFunction, getter = identity }: DistanceCalculationOptions<T, U>
): number[][] {
  const sourcePositions = sources.map(getter);
  const targetPositions = targets.map(getter);

  return sourcePositions.map((source) =>
    targetPositions.map((target) => distanceFunction(source, target))
  );
}

/**
 * Calculates the minimum distance between all pairs formed from the given
 * source and target points. The diagonal items of the distance matrix are
 * ignored if the same set of points is provided as sources and targets.
 */
export function calculateMinimumDistanceBetweenPairs<T, U = Coordinate2D>(
  sources: T[],
  targets: T[],
  options: DistanceCalculationOptions<T, U>
): number {
  // PERF: This is probably not the most efficient algorithm as it is O(n*m)
  // but since we are not going to do this multiple times it's probably okay.
  // Improve this when the time comes.

  const distanceMatrix = calculateDistanceMatrix(sources, targets, options);

  const distances =
    sources === targets
      ? distanceMatrix.flatMap((row, i) => row.filter((_, j) => i !== j))
      : distanceMatrix.flat();

  // Do not use Math.min() here -- it fails if the distance matrix is large,
  // which may happen for thousands of drones.
  return min(distances) ?? Number.POSITIVE_INFINITY;
}

/**
 * Calculates the length of a two dimensional vector.
 */
export const length2D = ([x, y]: Coordinate2D): number => Math.hypot(x, y);

/**
 * Calculates a normal vector for a segment defined by two points.
 */
export const getNormal2D = (p: Coordinate2D, q: Coordinate2D): Coordinate2D => [
  p[1] - q[1],
  q[0] - p[0],
];

/**
 * Calculates the dot product of two 2D vectors given by their coordinate pairs.
 */
export const dotProduct2D = (a: Coordinate2D, b: Coordinate2D): number =>
  a[0] * b[0] + a[1] * b[1];

/**
 * Euclidean distance function between two points, restricted to two dimensions.
 */
export const euclideanDistance2D = (
  a: Coordinate2DPlus,
  b: Coordinate2DPlus
): number => Math.hypot(a[0] - b[0], a[1] - b[1]);

/**
 * Calculates the squared Euclidean distance between two points, restricted to two dimensions.
 */
export const squaredEuclideanDistance2D = (
  a: Coordinate2DPlus,
  b: Coordinate2DPlus
): number => Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2);

/**
 * Calculates the area of a 2D triangle given the coordinates of its vertices.
 */
export const areaOfTriangle2D = (
  [ax, ay]: Coordinate2D,
  [bx, by]: Coordinate2D,
  [cx, cy]: Coordinate2D
): number => Math.abs(0.5 * (ax * (cy - by) + bx * (ay - cy) + cx * (by - ay)));

/**
 * Takes a polygon (i.e. an array of [x, y] coordinate pairs) and ensures that
 * it is closed in a way OpenLayers likes it, i.e. the last element is equal to
 * the first.
 */
export function closePolygon(poly: Coordinate2D[]): void {
  if (!Array.isArray(poly) || poly.length < 2) {
    return;
  }

  const firstPoint = poly.at(0);
  const lastPoint = poly.at(-1);

  if (!isCoordinate2D(firstPoint) || !isCoordinate2D(lastPoint)) {
    return;
  }

  const dim = firstPoint.length;
  let shouldClose = true;

  if (dim === lastPoint.length) {
    shouldClose = false;
    for (let i = 0; i < dim; i++) {
      if (firstPoint[i] !== lastPoint[i]) {
        shouldClose = true;
        break;
      }
    }
  }

  if (shouldClose) {
    poly.push(firstPoint);
  }
}

// (window as any).hullStatistics = {
//   time: [],
//   count: [],
// };

/**
 * Returns the 2D convex hull of a set of coordinates.
 */
export const convexHull2D = <C extends Coordinate2D | EasNor | LonLat>(
  coordinates: C[]
): C[] => {
  const start = performance.now();
  const result = false
    ? monotoneConvexHull2D(coordinates).map((index) => coordinates[index]!)
    : coordinates.length > 2
      ? // NOTE: Bang justified by `monotoneConvexHull2D` returning an index subset
        (concaveman(coordinates) as any)
      : coordinates;
  const end = performance.now();
  // (window as any).hullStatistics.time.push(end - start);
  // (window as any).hullStatistics.count.push([
  //   coordinates.length,
  //   result.length,
  // ]);
  return result as any;
};

/**
 * Creates an appropriate Turf.js geometry from the given list of coordinates.
 *
 * When no coordinates are provided, the result is undefined. When a single
 * coordinate is provided, a point geometry is returned. When two coordinates
 * are provided, a linestring geometry is returned with two points. When three
 * or more coordinates are provided, the result will be a Turf.js polygon.
 */
export function createGeometryFromPoints(
  coordinates: LonLat[]
): Result<Point | LineString | Polygon, string> {
  if (coordinates.length === 0) {
    return err('at least one point is required to create a geometry');
  }

  if (coordinates.length === 1 && isCoordinate2D(coordinates[0])) {
    return ok(TurfHelpers.point(coordinates[0]).geometry);
  }

  if (coordinates.length === 2) {
    return ok(TurfHelpers.lineString(coordinates).geometry);
  }

  const closedPoly = [...coordinates];
  closePolygon(closedPoly);

  return ok(TurfHelpers.polygon([closedPoly]).geometry);
}

/**
 * Calculate the bearing from one point to another.
 */
export const bearing = (p: Coordinate2D, q: Coordinate2D): number =>
  Math.PI / 2 - Math.atan2(q[1] - p[1], q[0] - p[0]);

/**
 * Estimate the amount of time it takes to travel a path with a given target
 * speed and acceleration.
 */
export const estimatePathDuration = (
  distance: number,
  targetSpeed: number,
  acceleration = 2.5
): number => {
  const maxAccelerationDuration = targetSpeed / acceleration;
  const maxAccelerationDistance = maxAccelerationDuration * (targetSpeed / 2);

  if (distance > 2 * maxAccelerationDistance) {
    // The target speed is achieved
    const constantSpeedDistance = distance - 2 * maxAccelerationDistance;
    const constantSpeedDuration = constantSpeedDistance / targetSpeed;
    return 2 * maxAccelerationDuration + constantSpeedDuration;
  } else {
    // Target speed will not be reached
    const accelerationDistance = distance / 2;
    const maxSpeed = Math.sqrt(2 * accelerationDistance * acceleration);
    const accelerationDuration = maxSpeed / acceleration;
    return 2 * accelerationDuration;
  }
};
