import { type Coordinate2D, squaredEuclideanDistance2D } from './math';

/**
 * Axis index.
 *
 * 0 stands for the X axis, 1 for the Y axis.
 */
type Axis = 0 | 1;

/**
 * Axes information.
 */
type Axes = {
  principal: Axis;
  secondary: Axis;
};

const divideAndConquerThreshold = 100;

/**
 * Finds the closest pair of points using a brute-force approach.
 *
 * @param points The array of points.
 *
 * @returns A tuple containing the two closest points and their **squared**
 *     distance, or `undefined` if fewer than two points are provided.
 */
function bruteForceNearestNeighbors(
  points: Coordinate2D[]
): [Coordinate2D, Coordinate2D, number] | undefined {
  const numPoints = points.length;
  if (numPoints < 2) {
    return undefined;
  }

  let minSqDist = Infinity;
  let result: [Coordinate2D, Coordinate2D] | undefined = undefined;

  for (let i = 0; i < numPoints; i++) {
    const pi = points[i]!;
    for (let j = i + 1; j < numPoints; j++) {
      const pj = points[j]!;
      const current = squaredEuclideanDistance2D(pi, pj);
      if (current < minSqDist) {
        minSqDist = current;
        result = [pi, pj];
      }
    }
  }

  return result === undefined ? undefined : [result[0], result[1], minSqDist];
}

/**
 * Determines the principal and secondary axes for partitioning points.
 *
 * The principal axis is the one with the widest range of coordinates.
 *
 * @param points An array of 2D points.
 *
 * @returns An object containing the principal and secondary axes.
 */
function determineAxes(points: Coordinate2D[]): Axes {
  if (points.length < 2) {
    // Default to x-axis if there are not enough points to determine a range
    return { principal: 0, secondary: 1 };
  }

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const point of points) {
    const [x, y] = point;
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);
  }

  const rangeX = maxX - minX;
  const rangeY = maxY - minY;

  if (rangeX >= rangeY) {
    return { principal: 0, secondary: 1 };
  } else {
    return { principal: 1, secondary: 0 };
  }
}

/**
 * Sorts an array of points by their principal axis.
 *
 * @param points The array of points.
 *
 * @returns A new array of points sorted along their principal axis.
 */
function sortByPrincipalAxis(
  points: Coordinate2D[],
  { principal }: Axes
): Coordinate2D[] {
  return points.slice().sort((a, b) => a[principal] - b[principal]);
}

/**
 * Finds the closest pair of points within a vertical strip.
 *
 * @param points The array of points, sorted along their principal axis.
 * @param midpoint The coordinate of the dividing line (along the principal axis).
 * @param dist The current minimum distance (**not squared**) found so far.
 *
 * @returns A tuple containing the two closest points and their squared distance,
 *     or `undefined` if no such pair is found.
 */
function findClosestPairInStrip(
  points: Coordinate2D[],
  midpoint: number,
  dist: number,
  axes: Axes
): [Coordinate2D, Coordinate2D, number] | undefined {
  // Filter points within the 'dist' strip around the midpoint
  const stripPoints = points.filter(
    (p) => Math.abs(p[axes.principal] - midpoint) < dist
  );

  if (stripPoints.length < 2) {
    return undefined;
  }

  // There is a bit of room for optimization here.

  let minSqDist = Infinity;
  let result: [Coordinate2D, Coordinate2D] | undefined = undefined;

  // Check points within the strip for closer pairs.
  for (let i = 0; i < stripPoints.length; i++) {
    const pi = stripPoints[i]!;
    for (let j = i + 1; j < stripPoints.length; j++) {
      const pj = stripPoints[j]!;
      if (pj[axes.secondary] - pi[axes.secondary] > dist) {
        continue;
      }

      const currentSqDist = squaredEuclideanDistance2D(pi, pj);
      if (currentSqDist < minSqDist) {
        minSqDist = currentSqDist;
        result = [pi, pj];
      }
    }
  }

  return result === undefined ? undefined : [result[0], result[1], minSqDist];
}

/**
 * Recursive step for the divide and conquer nearest neighbors algorithm.
 *
 * @param points The current subset of points, sorted along the principal axis.
 *
 * @returns A tuple containing the two closest points and their squared distance,
 *     or `undefined` if fewer than two points are provided.
 */
function divideAndConquer(
  points: Coordinate2D[],
  axes: Axes
): [Coordinate2D, Coordinate2D, number] | undefined {
  const numPoints = points.length;

  // Brute force algorithm for small subsets
  if (numPoints < divideAndConquerThreshold) {
    return bruteForceNearestNeighbors(points);
  }

  const midIndex = Math.floor(numPoints / 2);
  const midpointPrincipal = points[midIndex]![axes.principal]!;

  // Divide the points into two halves
  const leftHalf = points.slice(0, midIndex);
  const rightHalf = points.slice(midIndex);

  // Recursively find the closest pair in each half
  const leftResult = divideAndConquer(leftHalf, axes);
  const rightResult = divideAndConquer(rightHalf, axes);

  let nonStripResult: [Coordinate2D, Coordinate2D, number] | undefined;

  // Determine the closest pair from the two halves
  if (leftResult === undefined) {
    nonStripResult = rightResult;
  } else {
    if (rightResult === undefined) {
      nonStripResult = leftResult;
    } else {
      nonStripResult =
        leftResult[2] < rightResult[2] ? leftResult : rightResult;
    }
  }

  if (nonStripResult === undefined) {
    throw new Error('nonStripResult should exist!');
  }

  // Find the closest pair in the strip around the midpoint
  const stripResult = findClosestPairInStrip(
    points,
    midpointPrincipal,
    Math.sqrt(nonStripResult[2]),
    axes
  );

  if (stripResult === undefined) {
    return nonStripResult;
  }

  return nonStripResult[2] < stripResult[2] ? nonStripResult : stripResult;
}

/**
 * Finds the closest pair of points in a given array of points using the
 * standard Euclidean distance.
 *
 * @param points The array of 2D points.
 *
 * @returns A tuple containing the two closest points and their distance,
 *     or `undefined` if fewer than two points are provided.
 */
export function findNearestNeighbors(
  points: Coordinate2D[]
): [Coordinate2D, Coordinate2D, number] | undefined {
  const numPoints = points.length;

  let result: [Coordinate2D, Coordinate2D, number] | undefined;

  if (numPoints < 2) {
    return undefined;
  } else if (numPoints < divideAndConquerThreshold) {
    // Don't spend time on principal axis calculation if the array is small.
    result = bruteForceNearestNeighbors(points);
  } else {
    // Determine the principal axis and sort points along that.
    const axes = determineAxes(points);
    const sortedPoints = sortByPrincipalAxis(points, axes);

    // Run the search.
    result = divideAndConquer(sortedPoints, axes);
  }

  return result === undefined
    ? undefined
    : [result[0], result[1], Math.sqrt(result[2])];
}

/**
 * Finds the distance of the closest pair of points in a given array of points
 * using the standard Euclidean distance.
 *
 * @param points The array of 2D points.
 *
 * @returns The calculated distance or `Number.POSITIVE_INFINITY` is the array
 *     contains less than two points.
 */
export function findNearestNeighborsDistance(points: Coordinate2D[]) {
  const result = findNearestNeighbors(points);
  return result === undefined ? Number.POSITIVE_INFINITY : result[2];
}
