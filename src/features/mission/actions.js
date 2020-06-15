import hungarianAlgorithm from 'hungarian-on3';
import identity from 'lodash-es/identity';
import isNil from 'lodash-es/isNil';
import property from 'lodash-es/property';
import { getDistance as haversineDistance } from 'ol/sphere';

import {
  getEmptyMappingSlotIndices,
  getGPSBasedHomePositionsInMission,
  getMissionMapping,
} from './selectors';
import { removeUAVsFromMapping, replaceMapping } from './slice';

import {
  getOutdoorShowCoordinateSystem,
  getOutdoorShowOrientation,
  getShowCoordinateSystemTransformationObject,
} from '~/features/show/selectors';
import { showNotification } from '~/features/snackbar/slice';
import { MessageSemantics } from '~/features/snackbar/types';
import {
  getCurrentPositionByUavId,
  getMissingUAVIdsInMapping,
  getUnmappedUAVIds,
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

  return sourcePositions.map((source) =>
    targetPositions.map((target) => haversineDistance(source, target))
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
  const homePositions = getGPSBasedHomePositionsInMission(state);

  const slotsToFill = emptySlots.filter(
    (index) => !isNil(homePositions[index])
  );
  const targets = slotsToFill.map((index) => ({
    index,
    position: homePositions[index],
  }));

  const spareUAVIds = getUnmappedUAVIds(state);
  const sources = spareUAVIds.map((uavId) => ({
    uavId,
    position: getCurrentPositionByUavId(state, uavId),
  }));

  const getter = (item) => [item.position.lat, item.position.lon];
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
  const state = getState();

  // Get the coordinate system of the show
  const showCoordinateSystem = getOutdoorShowCoordinateSystem(state);
  const showCoordinateSystemTransformation = getShowCoordinateSystemTransformationObject(
    state
  );
  const orientation = getOutdoorShowOrientation(state);

  if (
    !showCoordinateSystem.origin ||
    typeof showCoordinateSystem.origin !== 'object'
  ) {
    throw new Error('Outdoor coordinate system not set up yet');
  }

  // Get the home coordinates of the drones from the current mission. The
  // configured origin and orientation of the virtual_uavs extension on the
  // server side does not matter as we will be sending explicit home coordinates.
  const homeCoordinates = getGPSBasedHomePositionsInMission(state).filter(
    Boolean
  );
  const numberDrones = homeCoordinates.length;
  const numberDigits = String(numberDrones).length;

  // Okay, this will have nothing to do with dispatching actions -- we
  // will simply send requests to the server.
  const config = await messageHub.query.getConfigurationOfExtension(
    'virtual_uavs'
  );

  // Update the coordinate system of the show
  config.origin = showCoordinateSystem.origin.slice(0, 2);
  config.orientation = orientation;
  config.type = showCoordinateSystem.type;

  // Update the home positions (specify them explicitly); we need them in
  // show coordinates
  // eslint-disable-next-line camelcase
  config.takeoff_area = {
    type: 'explicit',
    coordinates: homeCoordinates.map(({ lat, lon }) => {
      const [x, y] = showCoordinateSystemTransformation.fromLonLat([lon, lat]);
      return [x.toFixed(2), y.toFixed(2)];
    }),
  };

  // Update the ID style depending on the number of virtual drones
  // eslint-disable-next-line camelcase
  config.id_format = `{0:0${numberDigits}}`;

  // Update the number of drones as well for sake of consistency
  config.count = config.takeoff_area.coordinates.length;

  // Send the new configuration
  await messageHub.execute.configureExtension('virtual_uavs', config);

  // Reload the extension
  await messageHub.execute.reloadExtension('virtual_uavs');

  // Show a snackbar message
  dispatch(
    showNotification({
      message: 'Virtual drones configured successfully.',
      semantics: MessageSemantics.SUCCESS,
    })
  );
};

/**
 * Thunk that removes all the UAVs from the mapping that are currently
 * considered as missing.
 */
export const removeMissingUAVsFromMapping = () => (dispatch, getState) => {
  const state = getState();
  const missingUAVIds = getMissingUAVIdsInMapping(state);
  dispatch(removeUAVsFromMapping(missingUAVIds));
};
