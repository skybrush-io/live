import identity from 'lodash-es/identity';
import multiply from 'lodash-es/multiply';
import minBy from 'lodash-es/minBy';
import property from 'lodash-es/property';
import range from 'lodash-es/range';
import sum from 'lodash-es/sum';
import zipWith from 'lodash-es/zipWith';

import Polygon from 'ol/geom/Polygon';
import { getCenter } from 'ol/extent';

import monotoneConvexHull2D from 'monotone-convex-hull-2d';
import turfBuffer from '@turf/buffer';
import * as TurfHelpers from '@turf/helpers';

import { FlatEarthCoordinateSystem } from './geography';

/**
 * Returns the given number of degrees in radians.
 *
 * @param  {number} x  the degrees to convert
 * @return {number} the converted degrees in radians
 */
export function toRadians(x) {
  return (x * Math.PI) / 180;
}

export const degrees = toRadians;

/**
 * Returns the given number of radians in degrees.
 *
 * @param  {number} x  the radians to convert
 * @return {number} the converted radians in degrees
 */
export function toDegrees(x) {
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
 * @param  {number[]} center  the center coordinate at radius zero
 * @param  {number} angle   the angle
 * @param  {number} radius  the radius
 * @return {number[]}  the Cartesian coordinates equivalent to the input polar
 *         coordinates
 */
export function polarCCW({ center = [0, 0], angle, radius = 1 }) {
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
 * @param  {number[]} center  the center coordinate at radius zero
 * @param  {number} angle   the angle
 * @param  {number} radius  the radius
 * @return {number[]}  the Cartesian coordinates equivalent to the input polar
 *         coordinates
 */
export function polarCW({ center, angle, radius = 1 }) {
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
 * @param  {number[]} center  the center coordinate at radius zero
 * @param  {number} angle   the angle
 * @param  {number} radius  the radius
 * @return {number[]}  the Cartesian coordinates equivalent to the input polar
 *         coordinates
 */
export function polarCWNorth({ center, angle, radius = 1 }) {
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
export const toPolar = ({ x, y }) => ({
  angle: Math.atan2(y, x),
  radius: Math.sqrt(x ** 2 + y ** 2),
});

/**
 * Create a distance matrix between two arrays.
 */
export function calculateDistanceMatrix(
  sources,
  targets,
  { distanceFunction, getter } = {}
) {
  if (!getter) {
    getter = identity;
  } else if (typeof getter === 'string') {
    getter = property(getter);
  }

  if (!distanceFunction) {
    distanceFunction = euclideanDistance;
  }

  const sourcePositions = sources.map(getter);
  const targetPositions = targets.map(getter);

  return sourcePositions.map((source) =>
    targetPositions.map((target) => distanceFunction(source, target))
  );
}

// export const dotProduct1 = ([x1, y1], [x2, y2]) => x1 * x2 + y1 * y2;
// export const dotProduct2 = (a, b) => sum(zipWith(a, b, (a, b) => a * b));
// export const dotProduct3 = (a, b) => sum(zipWith(a, b, multiply));
export const dotProduct = (a, b) => sum(zipWith(a, b, multiply));

/**
 * Creates a distance function that calculates distances based on the given
 * L-norm. L = 1 is the taxicab distance; L = 2 is the standard Euclidean
 * norm; L = infinity is the maximum norm.
 */
export const createDistanceFunction = (norm = 2) => {
  if (norm <= 0) {
    throw new Error('norm must be positive');
  }
  if (norm === Number.POSITIVE_INFINITY) {
    return maximumNormDistance;
  } else {
    return (a, b) =>
      Math.pow(
        sum(zipWith(a, b), (a, b) => Math.pow(Math.abs(a - b), norm)),
        1 / norm
      );
  }
};

/**
 * Euclidean distance function between two points.
 */
export const euclideanDistance = createDistanceFunction(2);

/**
 * Maximum norm based distance function between two points.
 */
export const maximumNormDistance = (a, b) =>
  Math.max(zipWith(a, b, (a, b) => Math.abs(a - b)));

/**
 * Returns the 2D convex hull of a set of coordinates.
 */
export const convexHull = (coordinates) => {
  const indices = monotoneConvexHull2D(coordinates);
  return indices.map((index) =>
    coordinates[index].length > 2
      ? coordinates[index].slice(0, 2)
      : coordinates[index]
  );
};

/**
 * Given the coordinate list of a polygon, scale it by the given factor from its
 * center using the methods provided by OpenLayers.
 */
export const scalePolygon = (coordinates, factor) => {
  const p = new Polygon([coordinates]);

  p.scale(factor);

  return p.getCoordinates()[0];
};

/**
 * Grow a polygon by expanding its vertices from its center by a specific length
 * given through the margin parameter.
 */
export const growPolygon = (coordinates, margin) => {
  const center = getCenter(new Polygon([coordinates]).getExtent());

  return coordinates.map((c) => {
    const difference = [c[0] - center[0], c[1] - center[1]];

    const polar = {
      angle: Math.atan2(difference[1], difference[0]),
      radius: Math.sqrt(difference[0] ** 2 + difference[1] ** 2),
    };

    const adjustedDifference = [
      Math.cos(polar.angle) * (polar.radius + margin),
      Math.sin(polar.angle) * (polar.radius + margin),
    ];

    return [
      center[0] + adjustedDifference[0],
      center[1] + adjustedDifference[1],
    ];
  });
};

/**
 * Buffer a polygon by inserting a padding around it, so its new edge is at
 * least as far from the old one, as given in the margin parameter.
 */
export const bufferPolygon = (coordinates, margin) => {
  if (coordinates.length === 0) {
    return [];
  }

  const transform = new FlatEarthCoordinateSystem({
    origin: [0, 0],
  });

  const geoCoordinates = coordinates.map((coordinate) =>
    transform.toLonLat(coordinate)
  );
  geoCoordinates.push(geoCoordinates[0]);

  const poly = TurfHelpers.polygon([geoCoordinates]);
  const bufferedPoly = turfBuffer(
    poly.geometry,
    margin / 1000 /* Turf.js needs kilometers */
  );

  const outerLinearRing = bufferedPoly.geometry.coordinates[0].map(
    (coordinate) => transform.fromLonLat(coordinate)
  );
  return convexHull(outerLinearRing);
};

/**
 * Given five vertices, remove the middle one (c) and move the second (b) and
 * fourth (d) in a way that the original area is still covered.
 * The transformation essentially slides (b) along the (ab) line and (d) along
 * the (ed) line extending them until the new (bd) line "touches" (c).
 */
export const adjustAndRemoveMiddleVertex = ([a, b, c, d, e]) => {
  const getNormal = (p, q) => [p[1] - q[1], q[0] - p[0]];

  const leftNormal = getNormal(a, b);
  const centerNormal = getNormal(b, d);
  const rightNormal = getNormal(d, e);

  const leftConstant = dotProduct(leftNormal, a);
  const centerConstant = dotProduct(centerNormal, c);
  const rightConstant = dotProduct(rightNormal, e);

  // lNx lNy [ nBx ] = lC
  // cNx cNy [ nBy ] = cC

  const determinantLeft =
    leftNormal[0] * centerNormal[1] - leftNormal[1] * centerNormal[0];

  const determinantRight =
    rightNormal[0] * centerNormal[1] - rightNormal[1] * centerNormal[0];

  // nBx =  cNy -lNy [ lC ]
  // nBy = -cNx  lNx [ cC ]

  const newB = [
    (centerNormal[1] * leftConstant - leftNormal[1] * centerConstant) /
      determinantLeft,
    (-centerNormal[0] * leftConstant + leftNormal[0] * centerConstant) /
      determinantLeft,
  ];

  const newD = [
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
const length = ([x, y]) => Math.sqrt(x ** 2 + y ** 2);

/**
 * Calculate the amount of rotation at the corner formed by the three points.
 */
const turnAngle = (a, b, c) => {
  const u = [b[0] - a[0], b[1] - a[1]];
  const v = [c[0] - b[0], c[1] - b[1]];

  return Math.acos(dotProduct(u, v) / (length(u) * length(v)));
};

/**
 * Simplify a polygon given by its list of coordinates by continously removing
 * the vertices with the lowest surrounding turning rotations (equivalently, the
 * highest surrounding internal angles) and adjusting their neighbors until a
 * desired limit is reached.
 */
export const simplifyPolygonUntilLimit = (coordinates, limit) => {
  if (coordinates.length <= limit) {
    return coordinates;
  }

  const getCoordinate = (i) =>
    coordinates[(i + coordinates.length) % coordinates.length];

  const setCoordinate = (i, v) => {
    coordinates[(i + coordinates.length) % coordinates.length] = v;
  };

  const getAngleSumAt = (i) =>
    turnAngle(getCoordinate(i - 1), getCoordinate(i), getCoordinate(i + 1));

  const minAnglePosition = minBy(range(coordinates.length), getAngleSumAt);
  const updated = adjustAndRemoveMiddleVertex(
    [-2, -1, 0, 1, 2].map((i) => getCoordinate(minAnglePosition + i))
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
export const simplifyPolygon = ([_, ...coordinates], target) => {
  const result = simplifyPolygonUntilLimit(coordinates, target);
  return [...result, result[0]];
};
