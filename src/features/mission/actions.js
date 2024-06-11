/* global VERSION */

import formatDate from 'date-fns/format';
import { produce } from 'immer';
import isNil from 'lodash-es/isNil';
import pickBy from 'lodash-es/pickBy';
import unary from 'lodash-es/unary';
import { getDistance as haversineDistance } from 'ol/sphere';

import { findAssignmentInDistanceMatrix } from '~/algorithms/matching';
import { Colors } from '~/components/colors';
import { showErrorMessage } from '~/features/error-handling/actions';
import { setSelection } from '~/features/map/selection';
import {
  addFeatureIfMissing,
  selectSingleFeatureOfTypeUnlessAmbiguous,
} from '~/features/map-features/actions';
import {
  getFeatureById,
  getProposedIdForNewFeature,
  getSingleSelectedFeatureIdOfType,
} from '~/features/map-features/selectors';
import {
  addFeatureById,
  removeFeaturesByIds,
} from '~/features/map-features/slice';
import { showPromptDialog } from '~/features/prompt/actions';
import { getGeofenceSettings } from '~/features/safety/selectors';
import { addGeofencePolygonBasedOnShowTrajectories } from '~/features/show/actions';
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
  getUAVIdList,
  getUnmappedUAVIds,
} from '~/features/uavs/selectors';
import { openUploadDialogForJob } from '~/features/upload/slice';
import { ServerPlanError } from '~/flockwave/operations';
import messageHub from '~/message-hub';
import { FeatureType, LabelStyle } from '~/model/features';
import {
  missionItemIdToGlobalId,
  missionSlotIdToGlobalId,
} from '~/model/identifiers';
import {
  isMissionItemValid,
  MissionItemType,
  MissionType,
  schemaForMissionItemType,
  titleForMissionItemType,
} from '~/model/missions';
import { readFileAsText } from '~/utils/files';
import { readTextFromFile, writeTextToFile } from '~/utils/filesystem';
import {
  bufferPolygon,
  lonLatFromMapViewCoordinate,
  toLonLatFromScaledJSON,
} from '~/utils/geography';
import {
  calculateDistanceMatrix,
  euclideanDistance2D,
  simplifyPolygon,
} from '~/utils/math';
import { chooseUniqueId } from '~/utils/naming';

import { JOB_TYPE } from './constants';
import {
  contextVolatilities,
  ContextVolatility,
  getParametersFromContext,
  ParameterUIContext,
} from './parameter-context';
import {
  createCanMoveSelectedMissionItemsByDeltaSelector,
  getConvexHullOfMissionInMapViewCoordinates,
  getEmptyMappingSlotIndices,
  getGeofencePolygon,
  getGeofencePolygonId,
  getGPSBasedHomePositionsInMission,
  getItemIndexRangeForSelectedMissionItems,
  getLastClearedMissionData,
  getLastSuccessfulPlannerInvocationParameters,
  getMissionDataForStorage,
  getMissionItemById,
  getMissionItemsById,
  getMissionMapping,
  getMissionMappingFileContents,
  getMissionPlannerDialogContextParameters,
  getMissionPlannerDialogSelectedType,
  getMissionPlannerDialogUserParameters,
  getMissionType,
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
  setGeofencePolygonId,
  setLastClearedMissionData,
  setLastSuccessfulPlannerInvocationParameters,
  setMappingLength,
  setMissionName,
  setMissionPlannerDialogSelectedType,
  setMissionPlannerDialogUserParameters,
  setMissionType,
  updateCurrentMissionItemId,
  updateCurrentMissionItemRatio,
  updateHomePositions,
  updateMissionItemParameters,
  _setMissionItemsFromValidatedArray,
} from './slice';
import { getMissionItemUploadJobPayload } from './upload';

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
 * @param {Array.<string>} slotIds  the ids of the selected mission slots.
 *        Any mission slot whose id is not in this set will be deselected,
 *        and so will be anything that is not a mission slot.
 * @return {Object} an appropriately constructed action
 */
export const setSelectedMissionSlotIds = (slotIds) =>
  setSelection(
    (Array.isArray(slotIds) ? slotIds : [])
      .filter((slotId) => !isNil(slotId))
      .map((slotId) => missionSlotIdToGlobalId(slotId))
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
  const config =
    await messageHub.query.getConfigurationOfExtension('virtual_uavs');

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
 * Thunk that adds a geofence polygon with the given coordinates.
 */
export const addGeofencePolygon =
  (coordinates, owner, toLonLat) => (dispatch, getState) => {
    const state = getState();

    const { horizontalMargin, simplify, maxVertexCount } =
      getGeofenceSettings(state);

    const points = bufferPolygon(coordinates, horizontalMargin);

    const simplifiedPoints = simplify
      ? simplifyPolygon(points, maxVertexCount)
      : points;

    if (simplifiedPoints.length < 3) {
      throw new Error('Calculated geofence contains less than 3 points');
    }

    const geofencePolygon = {
      label: 'Geofence',
      labelStyle: LabelStyle.HIDDEN,
      type: FeatureType.POLYGON,
      owner,
      /* don't use a label; the geofence usually overlaps with the convex hull of
       * the show so it is confusing if the "Geofence" label appears in the middle
       * of the convex hull */
      color: Colors.geofence,
      points: simplifiedPoints.map(toLonLat),
    };
    const geofencePolygonId = getProposedIdForNewFeature(
      state,
      geofencePolygon
    );
    dispatch(
      addFeatureById({ feature: geofencePolygon, id: geofencePolygonId })
    );
    dispatch(setGeofencePolygonId(geofencePolygonId));
  };

/**
 * Thunk that adds a geofence polygon based on the current mission items.
 */
const addGeofencePolygonBasedOnMissionItems = () => (dispatch, getState) => {
  const state = getState();

  const coordinates = getConvexHullOfMissionInMapViewCoordinates(state);
  if (coordinates.length === 0) {
    dispatch(
      showNotification({
        message: `Could not calculate geofence coordinates.
                  Are there valid mission items with coordinates?`,
        semantics: MessageSemantics.ERROR,
        permanent: true,
      })
    );
    return;
  }

  dispatch(
    addGeofencePolygon(
      coordinates,
      MissionType.WAYPOINT,
      unary(lonLatFromMapViewCoordinate)
    )
  );
};

/**
 * Thunk that updates (adds if missing, replaces if present) the geofence
 * polygon based on the current mission type.
 */
export const updateGeofencePolygon = () => (dispatch, getState) => {
  dispatch(removeGeofencePolygon());
  const missionType = getMissionType(getState());
  switch (missionType) {
    case MissionType.SHOW: {
      dispatch(addGeofencePolygonBasedOnShowTrajectories());
      break;
    }

    case MissionType.WAYPOINT: {
      dispatch(addGeofencePolygonBasedOnMissionItems());
      break;
    }

    default: {
      dispatch(
        showNotification({
          message: `Cannot update geofence for mission type: "${missionType}"`,
          semantics: MessageSemantics.ERROR,
          permanent: true,
        })
      );
    }
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
    return item;
  };

export const editMissionItemParameters =
  (itemId) => async (dispatch, getState) => {
    const state = getState();
    const item = getMissionItemsById(state)[itemId];

    const parameters = await dispatch(
      showPromptDialog({
        initialValues: item.parameters,
        schema: {
          title: titleForMissionItemType[item.type],
          type: 'object',
          ...schemaForMissionItemType[item.type],
        },
      })
    );

    dispatch(updateMissionItemParameters(itemId, parameters));
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
 * Thunk that updates the parameters of a mission item based on a map feature.
 * It is used to store changes made to mission items that have visual
 * representations on the `mission-info` layer of the map.
 */
export const updateMissionItemFromFeature =
  (itemId, feature) => (dispatch, getState) => {
    const item = getMissionItemById(getState(), itemId);
    dispatch(
      updateMissionItemParameters(
        item.id,
        produce(item.parameters, (draft) => {
          switch (item.type) {
            case MissionItemType.GO_TO:
              [draft.lon, draft.lat] = feature.points[0];
              break;

            case MissionItemType.UPDATE_FLIGHT_AREA:
              draft.flightArea.polygons[0].points = feature.points;
              break;
          }
        })
      )
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
 * Helper function that transforms certain mission items received from the
 * planner before storing them in the state of the application.
 */
const processReceivedMissionItem = (item) => {
  switch (item.type) {
    case MissionItemType.UPDATE_FLIGHT_AREA:
      return produce(item, (draft) => {
        for (const p of draft.parameters.flightArea.polygons) {
          p.points = p.points.map(toLonLatFromScaledJSON);
        }
      });

    default:
      return item;
  }
};

/**
 * Thunk that prepares a mission by assigning context based parameters, invokes
 * the planner on the server and sets up a mission according to the response.
 */
export const invokeMissionPlanner =
  ({ resume = false } = {}) =>
  async (dispatch, getState) => {
    const state = getState();

    const { missionType, fromUser, fromContext, valuesFromContext } = resume
      ? structuredClone(getLastSuccessfulPlannerInvocationParameters(state))
      : {
          missionType: getMissionPlannerDialogSelectedType(state),
          fromUser: getMissionPlannerDialogUserParameters(state),
          fromContext: getMissionPlannerDialogContextParameters(state),
          valuesFromContext: {},
        };

    const activeContext = resume
      ? pickBy(
          fromContext,
          (_, key) => contextVolatilities[key] === ContextVolatility.DYNAMIC
        )
      : fromContext;

    // If we need to select a UAV from the context, and we only have a
    // single UAV at the moment, we can safely assume that this is the UAV
    // that the user wants to work with, so select it
    if (ParameterUIContext.SELECTED_UAV_COORDINATE in activeContext) {
      dispatch(selectSingleUAVUnlessAmbiguous());
    }

    // If we need to select a coordinate from the context, and we only have a
    // single UAV or marker at the moment, we can safely assume that this is the
    // UAV or marker that the user wants to work with, so select it
    if (ParameterUIContext.SELECTED_COORDINATE in activeContext) {
      dispatch(selectSingleUAVUnlessAmbiguous());
      dispatch(selectSingleFeatureOfTypeUnlessAmbiguous(FeatureType.POINTS));
    }

    // If we need to select a polygon / linestring feature from the context,
    // and we only have a single polygon / linestring that is owned by the
    // user at the moment, we can safely assume that this is the polygon /
    // linestring that the user wants to work with, so select it

    if (ParameterUIContext.SELECTED_POLYGON_FEATURE in activeContext) {
      dispatch(selectSingleFeatureOfTypeUnlessAmbiguous(FeatureType.POLYGON));
    }

    if (ParameterUIContext.SELECTED_LINE_STRING_FEATURE in activeContext) {
      dispatch(
        selectSingleFeatureOfTypeUnlessAmbiguous(FeatureType.LINE_STRING)
      );
    }

    try {
      Object.assign(
        valuesFromContext,
        getParametersFromContext(activeContext, getState)
      );
    } catch (error) {
      dispatch(showErrorMessage('Error while setting parameters', error));
      return;
    }

    const parameters = {
      ...valuesFromContext,
      ...fromUser,
    };

    let name = null;
    let items = null;
    try {
      ({ name, items } = await messageHub.execute.planMission({
        id: missionType,
        parameters,
      }));
      if (!Array.isArray(items)) {
        throw new TypeError('Expected an array of mission items');
      }
    } catch (error) {
      if (error instanceof ServerPlanError) {
        dispatch(
          showErrorMessage('Failed to plan mission on the server', error)
        );
      } else {
        dispatch(
          showErrorMessage('Error while invoking mission planner', error)
        );
      }
    }

    if (Array.isArray(items)) {
      dispatch(setMissionType(MissionType.WAYPOINT));
      dispatch(setMissionName(name));
      dispatch(setMissionItemsFromArray(items.map(processReceivedMissionItem)));
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
          missionType,
          fromUser,
          fromContext,
          valuesFromContext,
        })
      );

      dispatch(
        showNotification({
          message: 'Mission planned successfully. Would you like to export it?',
          semantics: MessageSemantics.SUCCESS,
          buttons: [
            {
              label: 'Export',
              action: exportMission(),
            },
          ],
          permanent: true,
          topic: 'export-suggestion',
        })
      );
    }
  };

/**
 * Thunk that clears a mission and shows a toast with an option to restore it.
 */
export const clearMission = () => (dispatch, _getState) => {
  dispatch(backupMission());
  dispatch(setMissionType(MissionType.UNKNOWN));
  dispatch(setMissionName(null));
  dispatch(setLastSuccessfulPlannerInvocationParameters(null));
  dispatch(setMissionItemsFromArray([]));
  dispatch(setMappingLength(0));
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
      permanent: true,
      topic: 'mission-cleared',
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
 * Thunk that restores missing mission features from a backed up context
 * parameter configuration.
 */
export const restoreMissingFeatures =
  (mapping, values) => (dispatch, getState) => {
    const state = getState();

    // Restore the missing linestring features
    const linestrings =
      mapping[ParameterUIContext.SELECTED_LINE_STRING_FEATURE] ?? [];
    for (const linestring of linestrings) {
      dispatch(
        addFeatureIfMissing(
          {
            type: FeatureType.LINE_STRING,
            points: values[linestring].map(toLonLatFromScaledJSON),
            label: linestring,
            owner: 'user',
          },
          ['type', 'points']
        )
      );
    }

    // Restore the missing marker features, and optionally place markers for UAV
    // and generic coordinates as well, if UAVs are not available
    const markers = mapping[ParameterUIContext.SELECTED_MARKER_FEATURE] ?? [];

    if (getUAVIdList(state).length === 0) {
      markers.push(
        ...(mapping[ParameterUIContext.SELECTED_UAV_COORDINATE] ?? []),
        ...(mapping[ParameterUIContext.SELECTED_COORDINATE] ?? [])
      );
    }

    for (const marker of markers) {
      dispatch(
        addFeatureIfMissing(
          {
            type: FeatureType.POINTS,
            points: [toLonLatFromScaledJSON(values[marker])],
            label: marker,
            owner: 'user',
          },
          ['type', 'points']
        )
      );
    }

    // Restore the missing polygon features
    const polygons = mapping[ParameterUIContext.SELECTED_POLYGON_FEATURE] ?? [];
    for (const polygon of polygons) {
      dispatch(
        addFeatureIfMissing(
          {
            type: FeatureType.POLYGON,
            points: values[polygon].points.map(toLonLatFromScaledJSON),
            holes: values[polygon].holes.map((hole) =>
              hole.map(toLonLatFromScaledJSON)
            ),
            label: polygon,
            owner: 'user',
          },
          ['type', 'points', 'holes']
        )
      );
    }
  };

/**
 * Thunk that restores a mission from previously backed up mission data.
 */
export const restoreMission =
  ({
    lastSuccessfulPlannerInvocationParameters: parameters,
    name,
    items,
    homePositions,
    progress: { id: currentMissionItemId, ratio: currentMissionItemRatio },
  }) =>
  (dispatch, _getState) => {
    dispatch(setMissionType(MissionType.WAYPOINT));
    dispatch(setMissionName(name));
    dispatch(setMissionItemsFromArray(items));
    dispatch(setMappingLength(homePositions.length));
    dispatch(updateHomePositions(homePositions));
    dispatch(updateCurrentMissionItemId(currentMissionItemId));
    dispatch(updateCurrentMissionItemRatio(currentMissionItemRatio));

    // Only restore from parameters if there has been a successful mission
    // planner invocation before the data was stored.
    if (parameters) {
      dispatch(setLastSuccessfulPlannerInvocationParameters(parameters));
      dispatch(setMissionPlannerDialogSelectedType(parameters.missionType));
      dispatch(setMissionPlannerDialogUserParameters(parameters.fromUser));
      dispatch(
        restoreMissingFeatures(
          parameters.fromContext,
          parameters.valuesFromContext
        )
      );
    }
  };

/**
 * Thunk that restores the last cleared mission.
 */
export const restoreLastClearedMission = () => (dispatch, getState) => {
  dispatch(restoreMission(getLastClearedMissionData(getState())));
  dispatch(showNotification({ topic: 'mission-cleared' }));
  dispatch(showSuccess('Mission restored successfully'));
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
  dispatch(showNotification({ topic: 'export-suggestion' }));
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
