import identity from 'lodash-es/identity';
import minBy from 'lodash-es/minBy';
import property, { type PropertyPath } from 'lodash-es/property';
import range from 'lodash-es/range';

import monotoneConvexHull2D from 'monotone-convex-hull-2d';
import * as TurfHelpers from '@turf/helpers';

export type Coordinate2D = [number, number];
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
export function getCentroid(points: Coordinate2D[], dim?: 2): Coordinate2D;
export function getCentroid(points: number[][], dim = 2): number[] {
  const result: number[] = Array.from({ length: dim }, () => 0);
  const n = points && Array.isArray(points) ? points.length : 0;

  if (n === 0) {
    return result;
  }

  for (const point of points) {
    for (let i = 0; i < dim; i++) {
      result[i] += point[i] || 0;
    }
  }

  for (let i = 0; i < dim; i++) {
    result[i] /= n;
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

/**
 * Create a distance matrix between two arrays.
 */
export function calculateDistanceMatrix<T>(
  sources: T[],
  targets: T[],
  {
    distanceFunction = euclideanDistance2D,
    getter = identity,
  }: {
    distanceFunction?: (a: Coordinate2D, b: Coordinate2D) => number;
    getter?: ((item: T) => Coordinate2D) | PropertyPath;
  } = {}
): number[][] {
  const getterFunction: (item: T) => Coordinate2D =
    typeof getter === 'function' ? getter : property(getter);

  const sourcePositions = sources.map(getterFunction);
  const targetPositions = targets.map(getterFunction);

  return sourcePositions.map((source) =>
    targetPositions.map((target) => distanceFunction(source, target))
  );
}

/**
 * Calculates the dot product of two 2D vectors given by their coordinate pairs.
 */
export const dotProduct2D = (a: Coordinate2D, b: Coordinate2D): number =>
  a[0] * b[0] + a[1] * b[1];

/**
 * Euclidean distance function between two points, restricted to two dimensions.
 */
export const euclideanDistance2D = (a: Coordinate2D, b: Coordinate2D): number =>
  Math.hypot(a[0] - b[0], a[1] - b[1]);

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

/**
 * Returns the 2D convex hull of a set of coordinates.
 */
export const convexHull = (coordinates: Coordinate2D[]): Coordinate2D[] => {
  const indices = monotoneConvexHull2D(coordinates);
  return indices.map((index) => {
    // NOTE: Bang justified by `monotoneConvexHull2D` selecting a subset
    const c = coordinates[index]!;
    // TODO: Should be unnecessary if the input only contains 2D coordinates
    return c.length > 2 ? (c.slice(0, 2) as Coordinate2D) : c;
  });

  // Alternative solution without relying on the non-null assertion operator:
  // return coordinates.filter((_c, i) => indices.includes(i));
};

/**
 * Creates an appropriate Turf.js geometry from the given list of coordinates.
 *
 * When no coordinates are provided, the result is undefined. When a single
 * coordinate is provided, a point geometry is returned. When two coordinates
 * are provided, a linestring geometry is returned with two points. When three
 * or more coordinates are provided, the result will be a Turf.js polygon.
 *
 * NOTE: This currently seems to only be used for polygons, maybe a separate
 * function is unnecessary?
 */
export function createGeometryFromPoints(
  coordinates: Coordinate2D[]
): TurfHelpers.Geometry | undefined {
  if (coordinates.length === 0) {
    return undefined;
  }

  if (coordinates.length === 1 && isCoordinate2D(coordinates[0])) {
    return TurfHelpers.point(coordinates[0]).geometry;
  }

  if (coordinates.length === 2) {
    return TurfHelpers.lineString(coordinates).geometry;
  }

  const closedPoly = [...coordinates];
  closePolygon(closedPoly);

  return TurfHelpers.polygon([closedPoly]).geometry;
}

/**
 * Given five vertices, remove the middle one (c) and move the second (b) and
 * fourth (d) in a way that the original area is still covered.
 * The transformation essentially slides (b) along the (ab) line and (d) along
 * the (ed) line extending them until the new (bd) line "touches" (c).
 */
export const adjustAndRemoveMiddleVertex = ([a, b, c, d, e]: [
  Coordinate2D,
  Coordinate2D,
  Coordinate2D,
  Coordinate2D,
  Coordinate2D
]): [Coordinate2D, Coordinate2D, Coordinate2D, Coordinate2D] => {
  const getNormal = (p: Coordinate2D, q: Coordinate2D): Coordinate2D => [
    p[1] - q[1],
    q[0] - p[0],
  ];

  const leftNormal = getNormal(a, b);
  const centerNormal = getNormal(b, d);
  const rightNormal = getNormal(d, e);

  const leftConstant = dotProduct2D(leftNormal, a);
  const centerConstant = dotProduct2D(centerNormal, c);
  const rightConstant = dotProduct2D(rightNormal, e);

  // lNx lNy [ nBx ] = lC
  // cNx cNy [ nBy ] = cC

  const determinantLeft =
    leftNormal[0] * centerNormal[1] - leftNormal[1] * centerNormal[0];

  const determinantRight =
    rightNormal[0] * centerNormal[1] - rightNormal[1] * centerNormal[0];

  // nBx =  cNy -lNy [ lC ]
  // nBy = -cNx  lNx [ cC ]

  const newB: Coordinate2D = [
    (centerNormal[1] * leftConstant - leftNormal[1] * centerConstant) /
      determinantLeft,
    (-centerNormal[0] * leftConstant + leftNormal[0] * centerConstant) /
      determinantLeft,
  ];

  const newD: Coordinate2D = [
    (centerNormal[1] * rightConstant - rightNormal[1] * centerConstant) /
      determinantRight,
    (-centerNormal[0] * rightConstant + rightNormal[0] * centerConstant) /
      determinantRight,
  ];

  return [a, newB, newD, e];
};

/**
 * Calculate the length of a two dimensional vector.
 */
const length2D = ([x, y]: Coordinate2D): number => Math.hypot(x, y);

/**
 * Calculate the amount of rotation at the corner formed by the three points.
 */
const turnAngle = (
  a: Coordinate2D,
  b: Coordinate2D,
  c: Coordinate2D
): number => {
  const u: Coordinate2D = [b[0] - a[0], b[1] - a[1]];
  const v: Coordinate2D = [c[0] - b[0], c[1] - b[1]];

  return Math.acos(dotProduct2D(u, v) / (length2D(u) * length2D(v)));
};

/**
 * Simplify a polygon given by its list of coordinates by continously removing
 * the vertices with the lowest surrounding turning rotations (equivalently, the
 * highest surrounding internal angles) and adjusting their neighbors until a
 * desired limit is reached.
 */
export const simplifyPolygonUntilLimit = (
  coordinates: Coordinate2D[],
  limit: number
): Coordinate2D[] => {
  if (limit < 3) {
    console.error('Limit cannot be less than 3.');
    return coordinates;
  }

  if (coordinates.length <= limit) {
    return coordinates;
  }

  const getCoordinate = (i: number): Coordinate2D =>
    // NOTE: Bang justified by remainder operation and `coordinates.length >= 3`
    coordinates.at(i % coordinates.length)!;

  const setCoordinate = (i: number, v: Coordinate2D): void => {
    coordinates[(i + coordinates.length) % coordinates.length] = v;
  };

  const getAngleAt = (i: number): number =>
    turnAngle(getCoordinate(i - 1), getCoordinate(i), getCoordinate(i + 1));

  // NOTE: Bang justified by return if `coordinates.length <= 3`
  const minAnglePosition = minBy(range(coordinates.length), getAngleAt)!;
  const updated = adjustAndRemoveMiddleVertex(
    [-2, -1, 0, 1, 2].map((i) => getCoordinate(minAnglePosition + i)) as [
      Coordinate2D,
      Coordinate2D,
      Coordinate2D,
      Coordinate2D,
      Coordinate2D
    ]
  );
  setCoordinate(minAnglePosition - 2, updated[0]);
  setCoordinate(minAnglePosition - 1, updated[1]);
  setCoordinate(minAnglePosition + 1, updated[2]);
  setCoordinate(minAnglePosition + 2, updated[3]);

  coordinates.splice(minAnglePosition, 1);

  return simplifyPolygonUntilLimit(coordinates, limit);
};

/**
 * Auxiliary wrapper function for simplifyPolygonUntilLimit that makes it
 * compatible with the OpenLayers style coordinate lists where the first and
 * last vertices are duplicates of each other.
 */
export const simplifyPolygon = (
  [_, ...coordinates]: Coordinate2D[],
  target: number
): Coordinate2D[] => {
  const result = simplifyPolygonUntilLimit(coordinates, target);

  if (!isCoordinate2D(result[0])) {
    throw new Error('polygons need to have at least three 2D vertices');
  }

  return [...result, result[0]];
};
