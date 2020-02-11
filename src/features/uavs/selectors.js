import isNil from 'lodash-es/isNil';
import { getDistance as haversineDistance } from 'ol/sphere';
import createCachedSelector from 're-reselect';

import { createSelector } from '@reduxjs/toolkit';

import {
  getHomePositionsInMission,
  getMissionMapping,
  getReverseMissionMapping
} from '~/features/mission/selectors';

/**
 * Returns the list of UAV IDs that should be shown on the UI, in the
 * order preferred by the state of the application.
 *
 * @param  {Object}  state  the state of the application
 */
export const getUAVIdList = state => state.uavs.order;

/**
 * Key selector function for cached selectors that cache things by UAV ID.
 */
const selectUavId = (_state, uavId) => uavId;

/**
 * Returns the UAV with the given ID, given the current state.
 */
export const getUavById = (state, uavId) => state.uavs.byId[uavId];

/**
 * Returns the current position of the UAV with the given ID, given the current
 * state.
 */
export const getCurrentPositionByUavId = (state, uavId) => {
  const uav = getUavById(state, uavId);
  return uav ? uav.position : undefined;
};

/**
 * Returns the home position of the UAV with the given ID, given the current
 * state.
 *
 * @param  {Object}  state  the state of the application
 * @param  {string}  uavId  the ID of the UAV
 */
export const getHomePositionByUavId = createCachedSelector(
  getReverseMissionMapping,
  getHomePositionsInMission,
  selectUavId,
  (revMapping, homePositions, uavId) => {
    const index = revMapping[uavId];
    console.log('Calculating getHomePositionByUavId() for', uavId);
    if (index === undefined) {
      // UAV is not in the mission. Later on, we can return the UAV's own home
      // position here if we decide to implement that.
      return undefined;
    }

    return homePositions[index];
  }
)({
  keySelector: selectUavId
  // TODO: use a FIFO or LRU cache if it becomes necessary
});

/**
 * Returns the distance of the UAV to its home position.
 */
export const getXYDistanceToHomePositionByUavId = createCachedSelector(
  getHomePositionByUavId,
  getCurrentPositionByUavId,
  (homePosition, currentPosition) => {
    if (homePosition !== undefined && currentPosition !== undefined) {
      return haversineDistance(
        [homePosition.lon, homePosition.lat],
        [currentPosition.lon, currentPosition.lat]
      );
    }

    return undefined;
  }
)({
  keySelector: selectUavId
  // TODO: use a FIFO or LRU cache if it becomes necessary
});

/**
 * Returns the farthest distance of an UAV from its home position, or undefined
 * if there are no UAVs with known current and home positions
 */
export const getFarthestDistanceFromHome = state => {
  const mapping = getMissionMapping(state);
  let maxDistance = -1;

  for (const uavId of mapping) {
    if (!isNil(uavId)) {
      const distance = getXYDistanceToHomePositionByUavId(state, uavId);
      if (distance > maxDistance) {
        maxDistance = distance;
      }
    }
  }

  return maxDistance < 0 ? undefined : maxDistance;
};

/**
 * Returns an array containing all the UAV IDs that appear in the mission mapping
 * but are not present in the UAV registry.
 */
export const getMissingUAVIdsInMapping = createSelector(
  getMissionMapping,
  state => state.uavs.byId,
  (mapping, uavsById) =>
    mapping.filter(uavId => !isNil(uavId) && isNil(uavsById[uavId]))
);
