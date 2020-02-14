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

import { showSnackbarMessage } from '~/features/snackbar/slice';
import { MessageSemantics } from '~/features/snackbar/types';
import {
  getCurrentPositionByUavId,
  getUnmappedUAVIds
} from '~/features/uavs/selectors';
import messageHub from '~/message-hub';

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

/**
 * Thunk that configures the virtual UAV extension of the server in a way
 * that one virtual UAV will be placed at each home coordinate in the
 * current mission.
 *
 * At the same time, the mapping will be cleared.
 */
export const addVirtualDronesForMission = () => async (dispatch, getState) => {
  // Get the home coordinates of the drones from the current mission. The
  // configured origin and orientation of the virtual_uavs extension on the
  // server side does not matter as we will be sending explicit home coordinates.
  const homeCoordinates = getHomePositionsInMission(getState()).filter(Boolean);
  const numDrones = homeCoordinates.length;
  const numDigits = String(numDrones).length;

  // Okay, this will have nothing to do with dispatching actions -- we
  // will simply send requests to the server.
  const config = await messageHub.query.getConfigurationOfExtension(
    'virtual_uavs'
  );

  // Update the home positions (specify them explicitly)
  // eslint-disable-next-line camelcase
  config.takeoff_area = {
    type: 'explicit',
    coordinates: homeCoordinates.map(({ lat, lon }) => ({
      lat: lat.toFixed(7),
      lon: lon.toFixed(7)
    }))
  };

  // Update the ID style depending on the number of virtual drones
  // eslint-disable-next-line camelcase
  config.id_format = `{0:0${numDigits}}`;

  // Send the new configuration
  // TODO(ntamas)

  // Reload the extension
  // TODO(ntamas)

  // Show a snackbar message
  dispatch(
    showSnackbarMessage({
      message: 'Virtual drones configured successfully.',
      semantics: MessageSemantics.SUCCESS
    })
  );
};
