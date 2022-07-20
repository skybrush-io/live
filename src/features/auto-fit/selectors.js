import {
  getFirstPointsOfTrajectories,
  getNumberOfDronesInShow,
  isShowOutdoor,
} from '~/features/show/selectors';
import {
  getActiveUAVIds,
  getCurrentGPSPositionByUavId,
  getCurrentHeadingByUavId,
} from '~/features/uavs/selectors';

/**
 * Returns whether the system can estimate the show coordinate system based on
 * the current positions of the drones.
 */
export function canEstimateShowCoordinateSystemFromActiveUAVs(state) {
  return (
    isShowOutdoor(state) &&
    getActiveUAVIds(state).length > 0 &&
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
export function getShowCoordinateSystemFittingProblemFromState(state) {
  const uavIds = getActiveUAVIds(state);
  const uavGPSCoordinates = uavIds.map((uavId) => {
    const { lat, lon } = getCurrentGPSPositionByUavId(state, uavId);
    return [lon, lat];
  });
  const uavHeadings = uavIds.map((uavId) =>
    getCurrentHeadingByUavId(state, uavId)
  );
  const takeoffCoordinates = getFirstPointsOfTrajectories(state);
  return {
    uavGPSCoordinates,
    uavHeadings,
    takeoffCoordinates,
  };
}
