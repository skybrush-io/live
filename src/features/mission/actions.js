import isNil from 'lodash-es/isNil';
import { getDistance as haversineDistance } from 'ol/sphere';

import { findAssignmentInDistanceMatrix } from '~/algorithms/matching';
import { setSelection } from '~/features/map/selection';
import { removeFeaturesByIds } from '~/features/map-features/slice';
import {
  getFirstPointsOfTrajectories,
  getOutdoorShowCoordinateSystem,
  getOutdoorShowToWorldCoordinateSystemTransformationObject,
  getShowOrientation,
  isShowIndoor,
  isShowOutdoor,
  proposeMappingFileName,
} from '~/features/show/selectors';
import { showError } from '~/features/snackbar/actions';
import { showNotification } from '~/features/snackbar/slice';
import { MessageSemantics } from '~/features/snackbar/types';
import {
  getCurrentGPSPositionByUavId,
  getCurrentLocalPositionByUavId,
  getMissingUAVIdsInMapping,
  getUnmappedUAVIds,
} from '~/features/uavs/selectors';
import messageHub from '~/message-hub';
import { missionSlotIdToGlobalId } from '~/model/identifiers';
import { readTextFromFile, writeTextToFile } from '~/utils/filesystem';
import { calculateDistanceMatrix, euclideanDistance2D } from '~/utils/math';

import {
  getEmptyMappingSlotIndices,
  getGeofencePolygonId,
  getGPSBasedHomePositionsInMission,
  getMissionMapping,
  getMissionMappingFileContents,
} from './selectors';
import { clearMapping, removeUAVsFromMapping, replaceMapping } from './slice';

/**
 * Thunk that fills the empty slots in the current mapping from the spare drones
 * that are not assigned to a mapping slot yet.
 */
export const augmentMappingAutomaticallyFromSpareDrones =
  ({ algorithm = 'greedy' } = {}) =>
  (dispatch, getState) => {
    const state = getState();
    const isIndoor = isShowIndoor(state);

    const homePositions = isIndoor
      ? getFirstPointsOfTrajectories(state)
      : getGPSBasedHomePositionsInMission(state);
    const positionGetter = isIndoor
      ? getCurrentLocalPositionByUavId
      : getCurrentGPSPositionByUavId;

    const emptySlots = getEmptyMappingSlotIndices(state);
    const slotsToFill = emptySlots.filter(
      (index) => !isNil(homePositions[index])
    );
    const targets = slotsToFill
      .map((index) => ({
        index,
        position: homePositions[index],
      }))
      .filter(({ position }) =>
        isIndoor ? Array.isArray(position) : !isNil(position)
      );

    const spareUAVIds = getUnmappedUAVIds(state);
    const sources = spareUAVIds
      .map((uavId) => ({
        uavId,
        position: positionGetter(state, uavId),
      }))
      .filter(({ position }) =>
        isIndoor ? Array.isArray(position) : !isNil(position)
      );

    const getter = isIndoor
      ? (item) => [item.position[0], item.position[1]]
      : (item) => [item.position.lon, item.position.lat];
    const distanceFunction = isIndoor ? euclideanDistance2D : haversineDistance;
    const threshold = isIndoor ? 1 : 3; /* meters */

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
      distanceFunction,
      getter,
    });

    const matching = findAssignmentInDistanceMatrix(distances, {
      algorithm,
      threshold,
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
 * Action factory that creates an action that sets the set of selected
 * mission slots (i.e. placeholders for drones in missions that are not assigned
 * yet).
 *
 * @param {Array.<string>} indices  the indices of the selected mission slots.
 *        Any mission slot whose index is not in this set will be deselected,
 *        and so will be anything that is not a mission slot.
 * @return {Object} an appropriately constructed action
 */
export const setSelectedMissionSlots = (indices) =>
  setSelection(
    (Array.isArray(indices) ? indices : [])
      .filter((index) => !isNil(index))
      .map((index) => missionSlotIdToGlobalId(index))
  );

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
  const showCoordinateSystemTransformation =
    getOutdoorShowToWorldCoordinateSystemTransformationObject(state);
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
  const homeCoordinates =
    getGPSBasedHomePositionsInMission(state).filter(Boolean);
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
 * Thunk that exports the current mapping to a file.
 */
export const exportMapping = () => async (dispatch, getState) => {
  const contents = getMissionMappingFileContents(getState());
  const proposedMappingFileName = proposeMappingFileName(getState());
  try {
    await writeTextToFile(contents, proposedMappingFileName, {
      title: 'Export mapping',
      properties: [
        'createDirectory',
        'showOverwriteConfirmation',
        'dontAddToRecent',
      ],
    });
  } catch (error) {
    dispatch(showError(`Error while exporting mapping: ${String(error)}`));
  }
};

/**
 * Thunk that imports a mapping from a file.
 */
export const importMapping = () => async (dispatch, getState) => {
  try {
    const contents = await readTextFromFile({
      title: 'Import mapping',
      properties: ['openFile', 'dontAddToRecent'],
    });
    const mapping = getMissionMapping(getState()).concat();
    const lines = contents.split('\n');
    let lineNumber = 0;

    for (let line of lines) {
      line = line.trim();
      lineNumber++;

      if (line.length === 0 || line.startsWith('#')) {
        continue;
      }

      const match = line.match(/^(?<index>\d+)(\s+(?<uavId>.*))?$/);
      if (!match) {
        throw new Error(`Malformed line ${lineNumber} in mapping file`);
      }

      const { uavId } = match.groups;
      const index = Number.parseInt(match.groups.index, 10);
      if (!Number.isInteger(index) || index <= 0) {
        throw new Error(
          `Invalid mission index in line ${lineNumber} of mapping file`
        );
      }

      if (index <= mapping.length) {
        mapping[index - 1] = uavId && uavId.length > 0 ? uavId : null;
      }
    }

    dispatch(replaceMapping(mapping));
  } catch (error) {
    dispatch(showError(`Error while importing mapping: ${String(error)}`));
  }
};

/**
 * Thunk that removes the current geofence polygon.
 */
export const removeGeofencePolygon = () => (dispatch, getState) => {
  dispatch(removeFeaturesByIds([getGeofencePolygonId(getState())]));
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
