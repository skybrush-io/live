import hungarianAlgorithm from 'hungarian-on3';
import identity from 'lodash-es/identity';
import isNil from 'lodash-es/isNil';
import property from 'lodash-es/property';
import { getDistance as haversineDistance } from 'ol/sphere';

import {
  getEmptyMappingSlotIndices,
  getHomePositionsInMission,
  getMissionMapping
} from './selectors';
import { replaceMapping } from './slice';

import {
  getCurrentPositionByUavId,
  getUnmappedUAVIds
} from '~/features/uavs/selectors';

/**
 * Create a distance matrix between two arrays.
 */
function calculateDistanceMatrix(sources, targets, { getter = null } = {}) {
  if (!getter) {
    getter = identity;
  } else if (typeof getter === 'string') {
    getter = property(getter);
  }

  const sourcePositions = sources.map(getter);
  const targetPositions = targets.map(getter);

  return sourcePositions.map(source =>
    targetPositions.map(target => haversineDistance(source, target))
  );
}

/**
 * Thunk that fills the empty slots in the current mapping from the spare drones
 * that are not assigned to a mapping slot yet.
 */
export const augmentMappingAutomaticallyFromSpareDrones = () => (
  dispatch,
  getState
) => {
  const state = getState();

  const emptySlots = getEmptyMappingSlotIndices(state);
  const homePositions = getHomePositionsInMission(state);

  const slotsToFill = emptySlots.filter(index => !isNil(homePositions[index]));
  const targets = slotsToFill.map(index => ({
    index,
    position: homePositions[index]
  }));

  const spareUAVIds = getUnmappedUAVIds(state);
  const sources = spareUAVIds.map(uavId => ({
    uavId,
    position: getCurrentPositionByUavId(state, uavId)
  }));

  const getter = item => [item.position.lat, item.position.lon];
  const distances = calculateDistanceMatrix(sources, targets, { getter });
  const matching = hungarianAlgorithm(distances);

  const newMapping = [...getMissionMapping(state)];
  for (const [sourceIndex, targetIndex] of matching) {
    newMapping[targets[targetIndex].index] = sources[sourceIndex].uavId;
  }

  dispatch(replaceMapping(newMapping));
};
