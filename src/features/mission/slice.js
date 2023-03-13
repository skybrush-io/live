/**
 * @file Slice of the state object that handles the state of the current
 * mission, i.e. a set of trajectories and commands that a group of UAVs must
 * perform, as well as a mapping from the mission-specific identifiers of
 * the UAVs to the real, physicaly identifiers of the UAVs that participate
 * in the mission.
 */

import isNil from 'lodash-es/isNil';

import { createSlice } from '@reduxjs/toolkit';

import { copyAndEnsureLengthEquals, getNewEditIndex } from './utils';

import { removeFeaturesByIds } from '~/features/map-features/slice';
import { GeofenceAction } from '~/features/safety/model';
import { MissionType } from '~/model/missions';
import {
  addItemAt,
  addItemToBack,
  deleteItemsByIds,
} from '~/utils/collections';
import { noPayload } from '~/utils/redux';

const { actions, reducer } = createSlice({
  name: 'mission',

  initialState: {
    // Type of the mission; ``show`` for drone shows. Empty string means that
    // there is no mission yet.
    type: '',

    // Stores a mapping from the mission-specific consecutive identifiers
    // to the IDs of the UAVs that participate in the mission with that
    // mission-specific identifier. The mapping may store UAV IDs and
    // null values for identifiers where the corresponding physical UAV
    // is not assigned yet.
    mapping: [],

    // Stores the desired home position (starting point) of each drone
    // in the mission, in GPS coordinates. The array is indexed by
    // mission-specific identifiers.
    homePositions: [],

    // Stores the desired landing position of each drone in the mission, in
    // GPS coordinates. The array is indexed by mission-specific identifiers.
    landingPositions: [],

    // Stores the takeoff headings of each drone in the missino. The array is
    // indexed by mission-specific identifiers.
    takeoffHeadings: [],

    // Stores the state of the mapping editor
    mappingEditor: {
      // Stores whether the mapping is currently being edited on the UI
      enabled: false,

      // Stores the index of the slot in the mapping that is being edited;
      // -1 if no slot is being edited
      indexBeingEdited: -1,
    },

    // Whether we prefer the primary or the secondary telemetry channel for
    // communication
    preferredChannelIndex: 0,

    // whether we are allowed to broadcast commands from the large flight
    // control panel to all UAVs
    commandsAreBroadcast: false,

    // ID of the polygon that holds the current geofence
    geofencePolygonId: undefined,

    // action to perform when the geofence is breached
    geofenceAction: GeofenceAction.RETURN,

    // collection of items in the current mission if it is a waypoint-based mission
    items: {
      byId: {
        /* each mission item looks like this:
         * {
         *   "id": "missionItemId",
         *   "type": ...type of the mission item...
         *   "parameters": {
         *     ...further parameters of the mission item, dependent on type...
         *   }
         * }
         *
         * Mission item types are in the MissionItemType enum in model/missions.js
         */
      },
      order: [],
    },

    // state of the mission editor panel
    editorPanel: {
      followScroll: false,
    },

    // state of the mission planner dialog
    plannerDialog: {
      applyGeofence: true,
      open: false,
      parameters: {
        fromUser: {},
        fromContext: {},
      },
      selectedType: null,
    },

    // parameters used in the last successful invocation of the mission planner
    lastSuccessfulPlannerInvocationParameters: null,

    // the progress of the mission as reported by the UAV
    progress: {
      currentItemId: undefined,
      currentItemRatio: undefined,
    },

    // backup of the last cleared mission
    lastClearedMissionData: null,
  },

  reducers: {
    addMissionItem(state, action) {
      const { item, index } = action.payload;
      const { id, type } = item;

      if (!id) {
        throw new Error('Mission item must have an ID');
      }

      if (!type) {
        throw new Error('Mission item must have a type');
      }

      if (state.items.byId[id]) {
        throw new Error('Mission item ID is already taken');
      }

      // Update the state
      if (typeof index === 'number') {
        addItemAt(state.items, item, index);
      } else {
        addItemToBack(state.items, item);
      }
    },

    adjustMissionMapping(state, action) {
      const { uavId, to } = action.payload;
      const from = state.mapping.indexOf(uavId);
      let uavIdToReplace = isNil(to) ? null : state.mapping[to];

      if (uavIdToReplace === undefined) {
        uavIdToReplace = null;
      }

      if (from >= 0) {
        state.mapping[from] = uavIdToReplace;
      }

      if (!isNil(to)) {
        state.mapping[to] = uavId;
      }
    },

    /**
     * Cancels the current editing session of the mapping at the current slot.
     */
    cancelMappingEditorSessionAtCurrentSlot: noPayload((state) => {
      state.mappingEditor.indexBeingEdited = -1;
    }),

    /**
     * Clears the id determining the polygon that is to be used as a geofence.
     */
    clearGeofencePolygonId: noPayload((state) => {
      state.geofencePolygonId = undefined;
    }),

    /**
     * Clears the entire mission mapping.
     */
    clearMapping(state) {
      const numberOfItems = state.mapping.length;
      state.mapping = Array.from({ length: numberOfItems }).fill(null);
    },

    /**
     * Clears a single slot in the mission mapping.
     */
    clearMappingSlot(state, action) {
      const index = action.payload;
      const numberItems = state.mapping.length;
      if (index >= 0 && index < numberItems) {
        state.mapping[index] = null;
      }
    },

    /**
     * Closes the mission planner dialog.
     */
    closeMissionPlannerDialog: noPayload((state) => {
      state.plannerDialog.open = false;
    }),

    /**
     * Finishes the current editing session of the mapping.
     */
    finishMappingEditorSession: {
      prepare: () => ({}), // this is to swallow event arguments
      reducer(state) {
        state.mappingEditor.enabled = false;
        state.mappingEditor.indexBeingEdited = -1;
      },
    },

    /**
     * Commits the new value in the mapping editor to the current slot being
     * edited, and optionally continues with the next slot.
     */
    commitMappingEditorSessionAtCurrentSlot(state, action) {
      const { continuation, value } = action.payload;
      const validatedValue =
        typeof value === 'string' && value.trim().length > 0 ? value : null;
      const index = state.mappingEditor.indexBeingEdited;
      const numberItems = state.mapping.length;

      if (index >= 0 && index < numberItems) {
        const oldValue = state.mapping[index];
        const existingIndex =
          validatedValue === null ? -1 : state.mapping.indexOf(validatedValue);

        // Prevent duplicates: if the value being entered already exists
        // elsewhere in the mapping, swap it with the old value of the
        // slot being edited.
        if (existingIndex >= 0) {
          state.mapping[existingIndex] = oldValue;
        }

        state.mapping[index] = validatedValue;
      }

      state.mappingEditor.indexBeingEdited = getNewEditIndex(
        state,
        continuation
      );
    },

    moveMissionItem: {
      prepare: (oldIndex, newIndex) => ({ payload: { oldIndex, newIndex } }),
      reducer(state, action) {
        const { oldIndex, newIndex } = action.payload;
        const numItems = state.items.order.length;
        if (
          oldIndex >= 0 &&
          oldIndex < numItems &&
          newIndex >= 0 &&
          newIndex < numItems &&
          oldIndex !== newIndex
        ) {
          const [itemId] = state.items.order.splice(oldIndex, 1);
          state.items.order.splice(newIndex, 0, itemId);
        }
      },
    },

    removeMissionItemsByIds(state, action) {
      return deleteItemsByIds(state.items, action.payload);
    },

    /**
     * Removes some UAVs from the mission mapping.
     */
    removeUAVsFromMapping(state, action) {
      for (const uavId of action.payload) {
        const index = state.mapping.indexOf(uavId);
        if (index >= 0) {
          state.mapping[index] = null;
        }
      }
    },

    /**
     * Replaces the entire mission mapping with a new one.
     */
    replaceMapping(state, action) {
      const newMapping = action.payload;

      if (!Array.isArray(newMapping)) {
        throw new TypeError('New mapping must be an array');
      }

      if (newMapping.length !== state.mapping.length) {
        throw new Error('Cannot change mapping length with replaceMapping()');
      }

      state.mapping = newMapping;
    },

    /**
     * Sets whether we are broadcasting all flight commands from the show control
     * panel to all UAVs if possible.
     */
    setCommandsAreBroadcast(state, action) {
      state.commandsAreBroadcast = Boolean(action.payload);
    },

    /**
     * Sets whether the mission editor panel should follow the active item.
     */
    setEditorPanelFollowScroll(state, action) {
      state.editorPanel.followScroll = Boolean(action.payload);
    },

    /**
     * Sets the action to perform when the geofence is breached.
     */
    setGeofenceAction(state, action) {
      state.geofenceAction = action.payload;
    },

    /**
     * Sets the ID determining the polygon that is to be used as a geofence.
     */
    setGeofencePolygonId(state, action) {
      state.geofencePolygonId = action.payload;
    },

    /**
     * Sets the length of the mapping. When the new length is smaller than the
     * old length, the mapping will be truncated from the end. When the new
     * length is larger than the old length, empty slots will be added to the
     * end of the mapping.
     */
    setMappingLength(state, action) {
      const desiredLength = Number.parseInt(action.payload, 10);

      if (
        Number.isNaN(desiredLength) ||
        desiredLength < 0 ||
        desiredLength > 1000
      ) {
        return;
      }

      const currentLength = state.mapping.length;

      if (desiredLength < currentLength) {
        state.mapping.splice(desiredLength);
        state.homePositions.splice(desiredLength);
      } else if (desiredLength > currentLength) {
        state.mapping.push(
          ...Array.from({ length: desiredLength - currentLength }).fill(null)
        );
        state.homePositions.push(
          ...Array.from({
            length: desiredLength - state.homePositions.length,
          }).fill(null)
        );
      }
    },

    /**
     * Sets the array of items in the mission, assuming that all items are
     * already validated.
     */
    _setMissionItemsFromValidatedArray(state, { payload: items }) {
      state.items = {
        order: items.map((i) => i.id),
        byId: Object.fromEntries(items.map((i) => [i.id, i])),
      };
      state.progress = {
        currentItemId: undefined,
        currentItemRatio: undefined,
      };
    },

    /**
     * Sets the type of the mission, without affecting any other part of the
     * current mission configuration.
     */
    setMissionType(state, action) {
      state.type =
        typeof action.payload === 'string'
          ? action.payload
          : MissionType.UNKNOWN;
    },

    setMissionPlannerDialogApplyGeofence(state, action) {
      state.plannerDialog.applyGeofence = action.payload;
    },

    setMissionPlannerDialogSelectedType(state, action) {
      state.plannerDialog.selectedType = action.payload;
    },

    setMissionPlannerDialogContextParametersAsMap: {
      // Convert the Map to an object to avoid issues with serialization.
      prepare: (fromContext) => ({
        payload: Object.fromEntries(fromContext.entries()),
      }),
      reducer(state, action) {
        state.plannerDialog.parameters.fromContext = action.payload;
      },
    },

    setMissionPlannerDialogContextParametersAsObject(state, action) {
      state.plannerDialog.parameters.fromContext = action.payload;
    },

    setMissionPlannerDialogUserParameters(state, action) {
      state.plannerDialog.parameters.fromUser = action.payload;
    },

    setLastSuccessfulPlannerInvocationParameters(state, action) {
      state.lastSuccessfulPlannerInvocationParameters = action.payload;
    },

    setLastClearedMissionData(state, action) {
      state.lastClearedMissionData = action.payload;
    },

    /**
     * Shows the mission planner dialog.
     */
    showMissionPlannerDialog: noPayload((state) => {
      state.plannerDialog.open = true;
    }),

    /**
     * Starts the current editing session of the mapping, and marks the
     * given slot in the mapping as the one being edited.
     */
    startMappingEditorSessionAtSlot(state, action) {
      const tentativeIndex =
        typeof action.payload === 'number' ? action.payload : -1;
      const numberItems = state.mapping.length;
      const index =
        tentativeIndex < 0 || tentativeIndex >= numberItems
          ? -1
          : tentativeIndex;

      state.mappingEditor.enabled = true;
      state.mappingEditor.indexBeingEdited = index;
    },

    /**
     * Starts the current editing session of the mapping.
     */
    startMappingEditorSession: {
      prepare: () => ({}), // this is to swallow event arguments
      reducer(state) {
        state.mappingEditor.enabled = true;
        state.mappingEditor.indexBeingEdited = -1;
      },
    },

    /**
     * Toggles the preferred communication channel for outbound commands
     * from priamry to secondary or vice versa
     */
    togglePreferredChannel(state) {
      state.preferredChannelIndex = state.preferredChannelIndex ? 0 : 1;
    },

    /**
     * Updates the id of the mission item that's currently being executed.
     */
    updateCurrentMissionItemId(state, action) {
      state.progress.currentItemId = action.payload;

      // Reset the progress to clear remaining data from the previous item.
      state.progress.currentItemRatio = undefined;
    },

    /**
     * Updates the progress ratio of the mission item that's currently being
     * executed.
     */
    updateCurrentMissionItemRatio(state, action) {
      state.progress.currentItemRatio = action.payload;
    },

    /**
     * Updates the home positions of all the drones in the mission.
     */
    updateHomePositions(state, action) {
      state.homePositions = copyAndEnsureLengthEquals(
        state.mapping.length,
        action.payload
      );
    },

    /**
     * Updates the landing positions of all the drones in the mission.
     */
    updateLandingPositions(state, action) {
      state.landingPositions = copyAndEnsureLengthEquals(
        state.mapping.length,
        action.payload
      );
    },

    /**
     * Updates the properties of a mission item in a waypoint-based mission.
     */
    updateMissionItemParameters: {
      prepare: (itemId, parameters) => ({ payload: { itemId, parameters } }),
      reducer(state, action) {
        const { itemId, parameters } = action.payload;
        const item = state.items.byId[itemId];
        if (item) {
          item.parameters = { ...item.parameters, ...parameters };
        }
      },
    },

    /**
     * Updates the takeoff headings of all the drones in the mission.
     */
    updateTakeoffHeadings(state, action) {
      if (Array.isArray(action.payload)) {
        state.takeoffHeadings = copyAndEnsureLengthEquals(
          state.mapping.length,
          action.payload
        );
      } else {
        state.takeoffHeadings = Array.from({
          length: state.mapping.length,
        }).fill(action.payload);
      }
    },
  },

  extraReducers: {
    [removeFeaturesByIds](state, action) {
      const ids = action.payload;
      if (ids.includes(state.geofencePolygonId)) {
        state.geofencePolygonId = undefined;
      }
    },
  },
});

export const {
  addMissionItem,
  adjustMissionMapping,
  cancelMappingEditorSessionAtCurrentSlot,
  clearGeofencePolygonId,
  clearMapping,
  clearMappingSlot,
  closeMissionPlannerDialog,
  commitMappingEditorSessionAtCurrentSlot,
  finishMappingEditorSession,
  moveMissionItem,
  removeMissionItemsByIds,
  removeUAVsFromMapping,
  replaceMapping,
  setCommandsAreBroadcast,
  setEditorPanelFollowScroll,
  setGeofenceAction,
  setGeofencePolygonId,
  setLastClearedMissionData,
  setLastSuccessfulPlannerInvocationParameters,
  setMappingLength,
  setMissionPlannerDialogApplyGeofence,
  setMissionPlannerDialogContextParametersAsMap,
  setMissionPlannerDialogContextParametersAsObject,
  setMissionPlannerDialogSelectedType,
  setMissionPlannerDialogUserParameters,
  setMissionType,
  showMissionPlannerDialog,
  startMappingEditorSession,
  startMappingEditorSessionAtSlot,
  togglePreferredChannel,
  updateCurrentMissionItemId,
  updateCurrentMissionItemRatio,
  updateHomePositions,
  updateLandingPositions,
  updateMissionItemParameters,
  updateTakeoffHeadings,
  _setMissionItemsFromValidatedArray,
} = actions;

export default reducer;
