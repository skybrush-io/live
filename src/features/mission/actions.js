import isNil from 'lodash-es/isNil';
import { getDistance as haversineDistance } from 'ol/sphere';

import { findAssignmentInDistanceMatrix } from './matching';
import {
  getEmptyMappingSlotIndices,
  getGeofencePolygonId,
  getGPSBasedHomePositionsInMission,
  getMissionMapping,
} from './selectors';
import { clearMapping, removeUAVsFromMapping, replaceMapping } from './slice';

import { removeFeature } from '~/actions/features';
import {
  getOutdoorShowCoordinateSystem,
  getOutdoorShowToWorldCoordinateSystemTransformationObject,
  getShowOrientation,
  isShowOutdoor,
} from '~/features/show/selectors';
import { showNotification } from '~/features/snackbar/slice';
import { MessageSemantics } from '~/features/snackbar/types';
import {
  getCurrentPositionByUavId,
  getMissingUAVIdsInMapping,
  getUnmappedUAVIds,
} from '~/features/uavs/selectors';
import messageHub from '~/message-hub';
import { calculateDistanceMatrix } from '~/utils/math';

/**
 * Thunk that fills the empty slots in the current mapping from the spare drones
 * that are not assigned to a mapping slot yet.
 */
export const augmentMappingAutomaticallyFromSpareDrones = ({
  algorithm = 'greedy',
} = {}) => (dispatch, getState) => {
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

  // Sources are the drones; targets are the takeoff positions.
  //
  // The apparently clever solution (Hungarian algorithm) is not that clever in
  // practice; for instance, if all drones but one are aligned exactly and one
  // drone is moved from its place at one end of a line to the _opposite_ end,
  // slightly outside the line, the algorithm will propose to shift all drones
  // in that line by one slot instead of saying that all the drones are in place
  // except one.
  //
  // We use a greedy algorithm instead; we calculate all distance pairs, find
  // the smallest distance, perform the assignment, exclude all distance pairs
  // belonging to the chosen drone and takeoff position, and continue until
  // we have no drones or no takeoff positions left.

  const distances = calculateDistanceMatrix(sources, targets, {
    distanceFunction: haversineDistance,
    getter,
  });
  const matching = findAssignmentInDistanceMatrix(distances, {
    algorithm,
    threshold: 3 /* meters */,
  });

  const newMapping = [...getMissionMapping(state)];
  for (const [sourceIndex, targetIndex] of matching) {
    newMapping[targets[targetIndex].index] = sources[sourceIndex].uavId;
  }

  dispatch(replaceMapping(newMapping));
};

/**
 * Thunk that recalculates the mapping completely by first clearing all items
 * from the mission mapping and then calling the mapping augmentation action.
 */
export const recalculateMapping = () => (dispatch) => {
  dispatch(clearMapping());
  dispatch(augmentMappingAutomaticallyFromSpareDrones());
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

  if (!isShowOutdoor(state)) {
    throw new Error('Virtual drones are supported for outdoor missions only');
  }

  // Get the coordinate system of the show
  const showCoordinateSystem = getOutdoorShowCoordinateSystem(state);
  const showCoordinateSystemTransformation = getOutdoorShowToWorldCoordinateSystemTransformationObject(
    state
  );
  const orientation = getShowOrientation(state);

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
 * Thunk that removes the current geofence polygon.
 */
export const removeGeofencePolygon = () => (dispatch, getState) => {
  dispatch(removeFeature(getGeofencePolygonId(getState())));
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
