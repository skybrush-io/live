/**
 * Implementation of the algorithm that automatically fits the show coordinate
 * system to the current measured positions of the drones.
 */

import isEqual from 'lodash-es/isEqual';
import { SVD as computeSVD } from 'svd-js';

import { COORDINATE_SYSTEM_TYPE } from '@skybrush/show-format';

import { findAssignmentInDistanceMatrix } from '~/algorithms/matching';
import { FlatEarthCoordinateSystem } from '~/utils/geography';
import {
  calculateDistanceMatrix,
  euclideanDistance2D,
  getCentroid,
  getMeanAngle,
  toDegrees,
  toRadians,
} from '~/utils/math';

/**
 * Runs the estimation process for the origin and orientation of the show, given
 * the description of the show coordinate system fitting problem.
 *
 * The problem is described by an object with the following shape:
 *
 * - `uavCoordinates` contains the GPS coordinates of the UAVs as an array of
 *   latitude-longitude pairs
 * - `uavHeadings` contains the headings of the UAVs
 * - `takeoffCoordinates` contains the takeoff coordinates in the show
 *   coordinate system, as an array of X-Y pairs
 *
 * An object of this shape can be retrieved from the current state with the
 * `getShowCoordinateSystemFittingProblemFromState()` selector.
 */
export function estimateShowCoordinateSystem(problem) {
  return refineEstimate(calculateInitialEstimate(problem), problem);
}

/**
 * Calculates the initial estimate for the show origin and orientation from
 * the problem description.
 *
 * The initial estimate is obtained by aligning the centroid of the takeoff
 * coordinates with the centroid of the UAVs, and rotating the X axis of the
 * show coordinate system to align with the mean heading of the UAVs.
 *
 * @param problem  the problem object containing the GPS positions of the UAVs
 *        in an array of longitude-latitude pairs, the headings of the UAVs,
 *        and the takeoff coordinates in an XYZ coordinate system
 * @return an object containing keys named `origin` and `orientation`
 */
function calculateInitialEstimate(problem) {
  const { uavGPSCoordinates, uavHeadings, takeoffCoordinates } = problem;

  if (uavGPSCoordinates.length === 0) {
    throw new Error('There are no UAVs with GPS coordinates to work with');
  }

  const uavGPSCentroid = getCentroid(uavGPSCoordinates);
  const orientation = getMeanAngle(uavHeadings);
  const gpsToLocal = new FlatEarthCoordinateSystem({
    origin: uavGPSCentroid,
    orientation: 0,
    type: COORDINATE_SYSTEM_TYPE,
  });
  const uavCoordinates = convertToFlatEarth(uavGPSCoordinates, gpsToLocal);
  const uavCenter = getCentroid(uavCoordinates);
  const takeoffCenter = getCentroid(takeoffCoordinates);
  const origin = subtract(uavCenter, rotate(takeoffCenter, orientation));
  return {
    origin: gpsToLocal.toLonLat(origin),
    orientation,
    type: COORDINATE_SYSTEM_TYPE,
  };
}

/**
 * Refines an initial estimate of the show origin and orientation and returns
 * an improved estimate.
 *
 * The algorithm runs multiple iterations of the ICP algorithm. In each iteration,
 * the UAVs are matched to their takeoff positions using a greedy matching
 * algorithm, and then the matched pairs are aligned (centroids are moved on
 * top of each other; the optimal rotation angle is determined by SVD). This
 * is then repeated until there is no change in the matching or until a maximum
 * number of iterations is reached.
 *
 * @param {object} estimate  the estimate to improve on
 * @param {object} problem   the problem description
 * @param {object} options   additional options for the refinement algorithm.
 *        Currently the following options are supported: `threshold` specifies
 *        the maximum distance in meters between a UAV and its corresponding
 *        takeoff coordinate, and `maxIterations` specifies the maximum number
 *        of iterations to perform with the ICP algorithm
 * @returns {object} an improved estimate
 */
function refineEstimate(estimate, problem, options = {}) {
  const { takeoffCoordinates, uavGPSCoordinates } = problem;
  const { threshold = 3 /* meters */, maxIterations = 20 } = options;

  let matching;
  let previousMatching;
  let converged = false;

  for (
    let iteration = 0;
    iteration < maxIterations && !converged;
    iteration++
  ) {
    const gpsToLocal = new FlatEarthCoordinateSystem(estimate);
    const uavCoordinates = convertToFlatEarth(uavGPSCoordinates, gpsToLocal);
    /* TODO(ntamas): calculate distances for only those pairs that are closer
     * than the given threshold */
    const distances = calculateDistanceMatrix(
      uavCoordinates,
      takeoffCoordinates,
      {
        distanceFunction: euclideanDistance2D,
      }
    );

    /* Figure out which UAVs to include in the refinement attempt */
    matching = findAssignmentInDistanceMatrix(distances, {
      algorithm: 'hungarian',
      threshold,
    });
    matching.sort((a, b) => a[1] - b[1]);
    if (isEqual(matching, previousMatching)) {
      /* Matching did not change, we can run one last alignment and then exit */
      converged = true;
    }

    if (matching.length === 0) {
      throw new Error(
        'Failed to find a sufficiently close matching between the drones and the takeoff positions'
      );
    }

    /*
     console.log(
       matching
         .map(
           ([uavIndex, takeoffIndex]) =>
             `${uavIds[uavIndex]}, s${takeoffIndex + 1}`
         )
         .join('\n')
     );
     */

    /* Decide whether we'll use this new matching or the previous one. We use
     * the new matching if it did not decrease the number of matched drones
     * _and_ we are not at the last iteration. In the last iteration, we always
     * keep the matching from the previous round so we can apply one final
     * SVD-based correction */
    if (
      previousMatching &&
      (matching.length < previousMatching.length ||
        iteration === maxIterations - 1)
    ) {
      /* Pick the old matching */
      matching = previousMatching;
    } else {
      /* Pick the new matching and remember it for the next iteration */
      previousMatching = matching;
    }

    /* Filter the coordinates and calculate the centroids */
    const numMatched = matching.length;
    let selectedUAVCoordinates = matching.map(
      ([index, _]) => uavCoordinates[index]
    );
    let selectedTakeoffCoordinates = matching.map(
      ([_, index]) => takeoffCoordinates[index]
    );
    const uavCenter = getCentroid(selectedUAVCoordinates);
    const takeoffCenter = getCentroid(selectedTakeoffCoordinates);

    /* Subtract the centroids from the coordinates */
    selectedUAVCoordinates = makeCentered(selectedUAVCoordinates, uavCenter);
    selectedTakeoffCoordinates = makeCentered(
      selectedTakeoffCoordinates,
      takeoffCenter
    );

    /* Calculate the dot product of the centered UAV and takeoff coordinate
     * matrices to obtain a 2x2 matrix on which the SVD will be performed */
    const dotProduct = [
      [0, 0],
      [0, 0],
    ];
    for (let i = 0; i < numMatched; i++) {
      const uavCoordinate = selectedUAVCoordinates[i];
      const takeoffCoordinate = selectedTakeoffCoordinates[i];
      dotProduct[0][0] += uavCoordinate[0] * takeoffCoordinate[0];
      dotProduct[0][1] += uavCoordinate[0] * takeoffCoordinate[1];
      dotProduct[1][0] += uavCoordinate[1] * takeoffCoordinate[0];
      dotProduct[1][1] += uavCoordinate[1] * takeoffCoordinate[1];
    }

    /* Calculate the SVD, figure out the angle to rotate the coordinate system with */
    const svd = computeSVD(dotProduct);
    const rotationMatrix = [
      [
        svd.u[0][0] * svd.v[0][0] + svd.u[0][1] * svd.v[0][1],
        svd.u[0][0] * svd.v[1][0] + svd.u[0][1] * svd.v[1][1],
      ],
      [
        svd.u[1][0] * svd.v[0][0] + svd.u[1][1] * svd.v[0][1],
        svd.u[1][0] * svd.v[1][0] + svd.u[1][1] * svd.v[1][1],
      ],
    ];
    const orientationOffset = toDegrees(
      Math.atan2(rotationMatrix[0][1], rotationMatrix[0][0])
    );
    const originOffset = subtract(
      uavCenter,
      rotate(takeoffCenter, orientationOffset)
    );

    /* Update the estimate */
    estimate = {
      origin: gpsToLocal.toLonLat([originOffset[0], originOffset[1]]),
      orientation: estimate.orientation + orientationOffset,
      type: COORDINATE_SYSTEM_TYPE,
    };
  }

  if (!converged) {
    console.warn('Maximum iteration count reached in ICP algorithm');
  }

  return estimate;
}

function subtract(foo, bar) {
  return [foo[0] - bar[0], foo[1] - bar[1]];
}

function rotate(vec, angle) {
  const angleRad = toRadians(angle);
  const ca = Math.cos(angleRad);
  const sa = Math.sin(angleRad);

  return [vec[0] * ca + vec[1] * sa, vec[0] * -sa + vec[1] * ca];
}

function makeCentered(points, centerHint) {
  if (centerHint === undefined) {
    centerHint = getCentroid(points);
  }

  return points.map((point) => subtract(point, centerHint));
}

function convertToFlatEarth(coords, transformation) {
  return coords.map((coord) => transformation.fromLonLat(coord));
}
