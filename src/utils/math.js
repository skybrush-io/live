import zipWith from 'lodash-es/zipWith';
import sortedUniqBy from 'lodash-es/sortedUniqBy';
import range from 'lodash-es/range';
import sum from 'lodash-es/sum';
import multiply from 'lodash-es/multiply';
import minBy from 'lodash-es/minBy';
import sortBy from 'lodash-es/sortBy';

import Polygon from 'ol/geom/Polygon';
import { getCenter } from 'ol/extent';

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

// export const dotProduct1 = ([x1, y1], [x2, y2]) => x1 * x2 + y1 * y2;
// export const dotProduct2 = (a, b) => sum(zipWith(a, b, (a, b) => a * b));
// export const dotProduct3 = (a, b) => sum(zipWith(a, b, multiply));
export const dotProduct = (a, b) => sum(zipWith(a, b, multiply));

export const convexHull = (coordinates) => {
  // Find the corner and convert the rest of the coordinates to a relative
  // representation measured from there.
  const [corner, ...rest] = sortBy(coordinates, ['1', '0']);
  const relativeCoordinates = rest.map((c) => [
    c[0] - corner[0],
    c[1] - corner[1],
  ]);

  // Sort the coordinates based on slope and use negative distance as a
  // tiebreaker. (Meaning, chose the furthest possible first.)
  // After sorting, remove all the extra points that fall on one line, so only
  // the furthest one remains from every group and all slopes are unique.
  const [first, ...sortedCoordinates] = sortedUniqBy(
    sortBy(relativeCoordinates, [
      (c) => c[0] / c[1], // slope
      (c) => -(c[0] ** 2 + c[1] ** 2), // negative distance
    ]),
    (c) => c[0] / c[1] // slope
  );

  // Given a list of previous points and a potential next one check if the new
  // point would result in a cavity, if so, remove the previous vertex and try
  // again, else just prepend it to the list.
  const appendPoint = ([b, a, ...hull], c) =>
    (b[1] - a[1]) * (c[0] - b[0]) <= (c[1] - b[1]) * (b[0] - a[0])
      ? appendPoint([a, ...hull], c)
      : [c, b, a, ...hull];

  // Append all the points starting from the corner [0, 0] and the first vertex.
  // Map the coordinates back to their original positions by translating them
  // using the original corner location.
  return sortedCoordinates
    .reduce(appendPoint, [first, [0, 0]]) // eslint-disable-line unicorn/no-reduce
    .map((c) => [c[0] + corner[0], c[1] + corner[1]]);
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
  const center = getCenter(new Polygon([coordinates]).getExtent());

  return coordinates.map((c) => {
    const difference = [c[0] - center[0], c[1] - center[1]];

    return [
      c[0] + Math.sign(difference[0]) * margin,
      c[1] + Math.sign(difference[1]) * margin,
    ];
  });
};

/**
 * Calculates a normal vector and a constant that can be used to describe a line
 * with the equation n · [x, y] = c.
 */
const getNormalAndConstant = (p, q) => {
  const n = [p[1] - q[1], p[0] - q[0]];
  const c = dotProduct(n, p);
  return { n, c };
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
 * highest surrounding internal angles) and ajusting their neighbors until a
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
