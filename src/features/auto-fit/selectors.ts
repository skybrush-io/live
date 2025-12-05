import isNil from 'lodash-es/isNil';

import { TakeoffHeadingMode } from '~/features/show/constants';
import {
  getFirstPointsOfTrajectories,
  getNumberOfDronesInShow,
  getTakeoffHeadingSpecification,
  getTakeoffHeadingSpecificationValueAsNumber,
  isShowOutdoor,
} from '~/features/show/selectors';
import {
  getActiveUAVIds,
  getCurrentGPSPositionByUavId,
  getCurrentHeadingByUavId,
} from '~/features/uavs/selectors';
import { type RootState } from '~/store/reducers';

import type { CoordinateSystemFittingProblem } from './types';
import type { LonLat } from '~/utils/geography';
import type { Coordinate2D, Coordinate2DPlus } from '~/utils/math';

// This will include drones that are sleeping, but that's okay.
// See discussion in https://github.com/skybrush-io/live/issues/80
const getUAVIdsUsedForAutoFit = getActiveUAVIds;

/**
 * Returns whether the system can estimate the show coordinate system based on
 * the current positions of the drones.
 */
export function canEstimateShowCoordinateSystemFromActiveUAVs(
  state: RootState
): boolean {
  return (
    isShowOutdoor(state) &&
    getUAVIdsUsedForAutoFit(state).length > 0 &&
    getNumberOfDronesInShow(state) > 0
  );
}

/**
 * Selector that takes the global state object and returns a concise description
 * of the show coordinate system fitting problem. The problem description
 * contains the current GPS coordinates and headings of the active UAVs, and
 * the list of _local_ takeoff coordinates. The problem involves finding the
 * origin and orientation of the show coordinate system that matches the current
 * GPS coordinates of the UAVs to the local takeoff coordinates in the most
 * accurate manner.
 *
 * @param {object} state  the global state object
 * @return {object} an object with the following keys and values: `uavGPSCoordinates`
 *         (the GPS coordinates of the UAVs, in an array of pairs, in lon-lat
 *         format), `uavHeadings` (the current headings of the UAVs, in degrees),
 *         and `takeoffCoordinates` (the takeoff coordinates in a local XY
 *         coordinate system, in an array of X-Y pairs)
 */
export function getShowCoordinateSystemFittingProblemFromState(
  state: RootState
): CoordinateSystemFittingProblem {
  const uavIds = getUAVIdsUsedForAutoFit(state);
  const uavGPSCoordinates: Array<LonLat | undefined> = uavIds.map((uavId) => {
    const position = getCurrentGPSPositionByUavId(state, uavId);
    // position may be undefined if the UAV has no GPS fix yet
    return position ? [position.lon, position.lat] : undefined;
  });
  const uavHeadings = uavIds.map((uavId) =>
    getCurrentHeadingByUavId(state, uavId)
  );

  // Headings and GPS coordinates at this point may contain undefined values;
  // we need to filter those
  const undefinedIndices = [];
  let n = uavGPSCoordinates.length;
  for (let i = 0; i < n; i++) {
    if (isNil(uavGPSCoordinates[i])) {
      undefinedIndices.push(i);
    }
  }

  // undefinedIndices is now in ascending order, so we process it from backwards
  // and remove the unneeded entries from uavGPSCoordinates. We allow some of
  // the headings to remain unspecified to prepare for compass-less operation
  n = undefinedIndices.length;
  for (let i = n - 1; i >= 0; i--) {
    const index = undefinedIndices[i]!;
    uavIds.splice(index, 1);
    uavGPSCoordinates.splice(index, 1);
    uavHeadings.splice(index, 1);
  }

  // At this point, uavGPSCoordinates and uavHeadings should not contain any
  // undefined values

  // For the remaining UAV headings, we need to correct them if we know in
  // advance that they are offset from the X axis of the show coordinate system
  const takeoffHeadingSpec = getTakeoffHeadingSpecification(state);
  if (takeoffHeadingSpec?.type === TakeoffHeadingMode.RELATIVE) {
    const delta = getTakeoffHeadingSpecificationValueAsNumber(state);
    if (typeof delta === 'number') {
      for (let i = 0; i < uavHeadings.length; i++) {
        const heading = uavHeadings[i];
        if (typeof heading === 'number') {
          uavHeadings[i] = (heading - delta) % 360;
        }
      }
    }
  }

  const takeoffCoordinates = getFirstPointsOfTrajectories(state)
    .filter(Boolean)
    .map((coord: Coordinate2DPlus | undefined): Coordinate2D | undefined =>
      coord ? [coord[0], coord[1]] : undefined
    )
    .filter(
      (coord: Coordinate2D | undefined): coord is Coordinate2D =>
        coord !== undefined
    );

  // At this point, uavGPSCoordinates and uavHeadings should not contain any
  // undefined values, so we can safely cast them to the correct types

  return {
    uavIds,
    uavGPSCoordinates: uavGPSCoordinates as LonLat[],
    uavHeadings,
    takeoffCoordinates,
  };
}
