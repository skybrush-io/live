/* global VERSION */

import formatDate from 'date-fns/format';
import isNil from 'lodash-es/isNil';
import { getDistance as haversineDistance } from 'ol/sphere';

import { findAssignmentInDistanceMatrix } from '~/algorithms/matching';
import { showErrorMessage } from '~/features/error-handling/actions';
import { setSelection } from '~/features/map/selection';
import { selectSingleFeatureOfTypeUnlessAmbiguous } from '~/features/map-features/actions';
import {
  getFeatureById,
  getSingleSelectedFeatureIdOfType,
} from '~/features/map-features/selectors';
import { removeFeaturesByIds } from '~/features/map-features/slice';
import { updateGeofencePolygon } from '~/features/show/actions';
import {
  getFirstPointsOfTrajectories,
  getOutdoorShowCoordinateSystem,
  getOutdoorShowToWorldCoordinateSystemTransformationObject,
  getShowOrientation,
  isShowIndoor,
  isShowOutdoor,
  proposeMappingFileName,
} from '~/features/show/selectors';
import {
  showError,
  showNotification,
  showSuccess,
} from '~/features/snackbar/actions';
import { MessageSemantics } from '~/features/snackbar/types';
import { selectSingleUAVUnlessAmbiguous } from '~/features/uavs/actions';
import {
  getCurrentGPSPositionByUavId,
  getCurrentLocalPositionByUavId,
  getMissingUAVIdsInMapping,
  getSingleSelectedUAVId,
  getUnmappedUAVIds,
} from '~/features/uavs/selectors';
import { openUploadDialogForJob } from '~/features/upload/slice';
import { ServerPlanError } from '~/flockwave/operations';
import messageHub from '~/message-hub';
import { FeatureType } from '~/model/features';
import {
  missionItemIdToGlobalId,
  missionSlotIdToGlobalId,
} from '~/model/identifiers';
import {
  getCoordinateFromMissionItem,
  isMissionItemValid,
  MissionItemType,
  MissionType,
} from '~/model/missions';
import { readTextFromFile, writeTextToFile } from '~/utils/filesystem';
import { translateLonLatWithMapViewDelta } from '~/utils/geography';
import { calculateDistanceMatrix, euclideanDistance2D } from '~/utils/math';
import { chooseUniqueId } from '~/utils/naming';

import { JOB_TYPE } from './constants';
import {
  getParametersFromContext,
  ParameterUIContext,
} from './parameter-context';
import {
  createCanMoveSelectedMissionItemsByDeltaSelector,
  getEmptyMappingSlotIndices,
  getGeofencePolygon,
  getGeofencePolygonId,
  getGPSBasedHomePositionsInMission,
  getItemIndexRangeForSelectedMissionItems,
  getLastClearedMissionData,
  getMissionDataForStorage,
  getMissionItemById,
  getMissionItemsById,
  getMissionItemUploadJobPayload,
  getMissionMapping,
  getMissionMappingFileContents,
  getMissionPlannerDialogContextParameters,
  getMissionPlannerDialogSelectedType,
  getMissionPlannerDialogUserParameters,
  getSelectedMissionItemIds,
  shouldMissionPlannerDialogApplyGeofence,
} from './selectors';
import {
  addMissionItem,
  clearMapping,
  closeMissionPlannerDialog,
  moveMissionItem,
  removeMissionItemsByIds,
  removeUAVsFromMapping,
  replaceMapping,
  setLastClearedMissionData,
  setLastSuccessfulPlannerInvocationParameters,
  setMappingLength,
  setMissionType,
  updateCurrentMissionItemId,
  updateCurrentMissionItemRatio,
  updateHomePositions,
  updateMissionItemParameters,
  _setMissionItemsFromValidatedArray,
} from './slice';
import { readFileAsText } from '~/utils/files';

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
  dispatch(showSuccess('Virtual drones configured successfully.'));
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

/**
 * Thunk that assumes that a single-UAV mission is going to be executed and
 * assigns the selected UAV to the mission.
 */
export const prepareMappingForSingleUAVMissionFromSelection =
  () => (dispatch, getState) => {
    const state = getState();
    const uavId = getSingleSelectedUAVId(state);

    if (uavId) {
      const uavPosition = getCurrentGPSPositionByUavId(state, uavId);

      dispatch(setMappingLength(1));
      dispatch(replaceMapping([uavId]));

      if (uavPosition) {
        dispatch(updateHomePositions([uavPosition]));
      }
    } else {
      const featureId = getSingleSelectedFeatureIdOfType(FeatureType.POINTS)(
        state
      );

      dispatch(setMappingLength(1));
      dispatch(replaceMapping([featureId]));

      const [lon, lat] = getFeatureById(state, featureId).points[0];

      // TODO: amsl of marker?
      dispatch(updateHomePositions([{ lon, lat, agl: 0, amsl: undefined }]));
    }
  };

/**
 * Thunk that adds a new mission item of the given type to the end of the
 * current mission.
 */
export const addNewMissionItem =
  (type = MissionItemType.UNKNOWN, parameters = {}) =>
  (dispatch, getState) => {
    const state = getState();
    const allMissionItemsById = getMissionItemsById(state);
    const newItemId = chooseUniqueId('missionItem', allMissionItemsById);
    const item = {
      id: newItemId,
      type,
      parameters,
    };
    dispatch(addMissionItem({ item }));
  };

/**
 * Thunk that adds a new "go to" waypoint item to the end of the current
 * mission.
 */
export const addNewWaypointMissionItem = (coords) => (dispatch) => {
  const { lon, lat } = coords;
  dispatch(addNewMissionItem(MissionItemType.GO_TO, { lon, lat }));
};

/**
 * Thunk that moves the selected waypoint item(s) up or down by one slot.
 */
export const moveSelectedMissionItemsByDelta = (delta) => {
  if (delta !== 1 && delta !== -1) {
    throw new Error('Only delta = +/-1 is supported');
  }

  return (dispatch, getState) => {
    const state = getState();
    const canMove = createCanMoveSelectedMissionItemsByDeltaSelector(delta);
    if (!canMove(state)) {
      return;
    }

    const [minIndex, maxIndex] =
      getItemIndexRangeForSelectedMissionItems(state);
    if (delta === -1) {
      dispatch(moveMissionItem(minIndex - 1, maxIndex));
    } else if (delta === 1) {
      dispatch(moveMissionItem(maxIndex + 1, minIndex));
    }
  };
};

/**
 * Thunk that removes the selected mission items from the mission.
 */
export const removeSelectedMissionItems = () => (dispatch, getState) => {
  const selectedMissionItemIds = getSelectedMissionItemIds(getState());
  dispatch(removeMissionItemsByIds(selectedMissionItemIds));
};

/**
 * Action factory that creates an action that updates the selection to the
 * given list of mission item IDs.
 *
 * @param {string[]} ids  the IDs of the selected mission items. Any mission
 *        item whose ID is not in this set will be deselected, and so will be
 *        any other item that is not a mission item.
 * @return {Object} an appropriately constructed action
 */
export const setSelectedMissionItemIds = (ids) =>
  setSelection(ids.map(missionItemIdToGlobalId));

/**
 * Thunk that moves the coordinates of the mission item with the given ID
 * with the given delta, expressed in map view coordinates.
 */
export const moveMissionItemCoordinateByMapCoordinateDelta =
  (itemId, delta) => (dispatch, getState) => {
    const item = getMissionItemById(getState(), itemId);
    if (!item || !isMissionItemValid(item)) {
      return;
    }

    const coord = getCoordinateFromMissionItem(item);
    if (!coord) {
      return;
    }

    const newCoord = translateLonLatWithMapViewDelta(
      [coord.lon, coord.lat],
      delta
    );

    dispatch(
      updateMissionItemParameters(itemId, {
        lon: newCoord[0],
        lat: newCoord[1],
      })
    );
  };

/**
 * Thunk that receives an array of mission items and completely replaces the
 * current list of mission items with the received ones, rejecting mission
 * items whose format is invalid.
 */
export const setMissionItemsFromArray = (items) => (dispatch) => {
  const validItems = [];
  let index = 0;

  for (const item of items) {
    if (!item || !isMissionItemValid(item)) {
      console.warn(`Rejecting invalid mission item at index ${index}`);
    } else {
      validItems.push(item);
    }

    index++;
  }

  dispatch(_setMissionItemsFromValidatedArray(validItems));
};

/**
 * Thunk that uploads the current list of mission items to the selected UAV.
 */
export const uploadMissionItemsToSelectedUAV = () => (dispatch, getState) => {
  const state = getState();
  const selectedUAVId = getSingleSelectedUAVId(state);
  if (selectedUAVId !== undefined) {
    const payload = getMissionItemUploadJobPayload(state);
    dispatch(openUploadDialogForJob({ job: { type: JOB_TYPE, payload } }));
  }
};

/**
 * Thunk that prepares a mission by assigning context based parameters, invokes
 * the planner on the server and sets up a mission according to the response.
 */
export const invokeMissionPlanner = () => async (dispatch, getState) => {
  const state = getState();

  const selectedMissionType = getMissionPlannerDialogSelectedType(state);
  const fromUser = getMissionPlannerDialogUserParameters(state);
  const fromContext = getMissionPlannerDialogContextParameters(state);

  // If we need to select a UAV from the context, and we only have a
  // single UAV at the moment, we can safely assume that this is the UAV
  // that the user wants to work with, so select it
  if (fromContext.has(ParameterUIContext.SELECTED_UAV_COORDINATE)) {
    dispatch(selectSingleUAVUnlessAmbiguous());
  }

  // If we need to select a coordinate from the context, and we only have a
  // single UAV or marker at the moment, we can safely assume that this is the
  // UAV or marker that the user wants to work with, so select it
  if (fromContext.has(ParameterUIContext.SELECTED_COORDINATE)) {
    dispatch(selectSingleUAVUnlessAmbiguous());
    dispatch(selectSingleFeatureOfTypeUnlessAmbiguous(FeatureType.POINTS));
  }

  // If we need to select a polygon / linestring feature from the context,
  // and we only have a single polygon / linestring that is owned by the
  // user at the moment, we can safely assume that this is the polygon /
  // linestring that the user wants to work with, so select it

  if (fromContext.has(ParameterUIContext.SELECTED_POLYGON_FEATURE)) {
    dispatch(selectSingleFeatureOfTypeUnlessAmbiguous(FeatureType.POLYGON));
  }

  if (fromContext.has(ParameterUIContext.SELECTED_LINE_STRING_FEATURE)) {
    dispatch(selectSingleFeatureOfTypeUnlessAmbiguous(FeatureType.LINE_STRING));
  }

  const valuesFromContext = {};
  try {
    Object.assign(
      valuesFromContext,
      getParametersFromContext(fromContext, getState)
    );
  } catch (error) {
    dispatch(showErrorMessage('Error while setting parameters', error));
    return;
  }

  const parameters = {
    ...valuesFromContext,
    ...fromUser,
  };

  let items = null;
  try {
    items = await messageHub.execute.planMission({
      id: selectedMissionType,
      parameters,
    });
    if (!Array.isArray(items)) {
      throw new TypeError('Expected an array of mission items');
    }
  } catch (error) {
    if (error instanceof ServerPlanError) {
      dispatch(showErrorMessage('Failed to plan mission on the server', error));
    } else {
      dispatch(showErrorMessage('Error while invoking mission planner', error));
    }
  }

  if (Array.isArray(items)) {
    dispatch(setMissionType(MissionType.WAYPOINT));
    dispatch(setMissionItemsFromArray(items));
    dispatch(prepareMappingForSingleUAVMissionFromSelection());
    dispatch(closeMissionPlannerDialog());

    if (
      shouldMissionPlannerDialogApplyGeofence(state) &&
      getGeofencePolygon(state)?.owner !== 'user'
    ) {
      dispatch(updateGeofencePolygon());
    }

    dispatch(
      setLastSuccessfulPlannerInvocationParameters({
        type: selectedMissionType,
        parametersFromUser: fromUser,
        valuesFromContext,
      })
    );

    dispatch(
      showNotification({
        message: 'Mission planned successfully. Export it?',
        semantics: MessageSemantics.SUCCESS,
        buttons: [
          {
            label: 'Export',
            action: exportMission(),
          },
        ],
      })
    );
  }
};

/**
 * Thunk that clears a mission and shows a toast with an option to restore it.
 */
export const clearMission = () => (dispatch, _getState) => {
  dispatch(backupMission());
  dispatch(setMissionItemsFromArray([]));
  dispatch(
    showNotification({
      message: 'Previous mission cleared.',
      semantics: MessageSemantics.INFO,
      buttons: [
        {
          label: 'Undo',
          action: restoreLastClearedMission(),
        },
      ],
    })
  );
};

/**
 * Thunk that backs up a mission to the store.
 * (Intended to be used as a restore point after clearing.)
 */
export const backupMission = () => (dispatch, getState) => {
  dispatch(setLastClearedMissionData(getMissionDataForStorage(getState())));
};

/**
 * Thunk that restores a mission from previously backed up mission data.
 */
export const restoreMission =
  ({
    parameters,
    items,
    homePositions,
    progress: { id: currentMissionItemId, ratio: currentMissionItemRatio },
  }) =>
  (dispatch, _getState) => {
    dispatch(setLastSuccessfulPlannerInvocationParameters(parameters));
    dispatch(setMissionItemsFromArray(items));
    dispatch(setMappingLength(homePositions.length));
    dispatch(updateHomePositions(homePositions));
    dispatch(updateCurrentMissionItemId(currentMissionItemId));
    dispatch(updateCurrentMissionItemRatio(currentMissionItemRatio));
  };

/**
 * Thunk that restores the last cleared mission.
 */
export const restoreLastClearedMission = () => (dispatch, getState) => {
  dispatch(restoreMission(getLastClearedMissionData(getState())));
};

/**
 * Thunk that stores the current mission into a file.
 */
export const exportMission = () => (dispatch, getState) => {
  const state = getState();
  // The ISO 8601 extended format cannot be used because colons are usually not
  // allowed in filenames, and the ISO 8601 basic format is less human-readable
  const date = formatDate(new Date(), 'yyyy-MM-dd_HH-mm-ss');
  const missionData = getMissionDataForStorage(state);
  const metaData = { exportedAt: date, skybrushVersion: VERSION };
  writeTextToFile(
    JSON.stringify({ meta: metaData, mission: missionData }, null, 2),
    `mission-export-${date}.json`,
    { title: 'Export mission data' }
  );
  dispatch(showSuccess('Successfully exported mission'));
};

/**
 * Thunk that loads a mission from a file, replacing the current mission.
 */
export const importMission = (file) => async (dispatch, _getState) => {
  try {
    const data = JSON.parse(await readFileAsText(file));
    dispatch(restoreMission(data.mission));
    dispatch(showSuccess('Successfully imported mission'));
  } catch (error) {
    dispatch(showError(`Error while importing mission: ${error}`));
  }
};
