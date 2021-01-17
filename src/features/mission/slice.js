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

import { noPayload } from '~/utils/redux';

const { actions, reducer } = createSlice({
  name: 'mission',

  initialState: {
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

    // geofence: {
    geofencePolygonId: undefined,
    // },
  },

  reducers: {
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
      const numberItems = state.mapping.length;
      state.mapping = new Array(numberItems).fill(null);
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
          ...new Array(desiredLength - currentLength).fill(null)
        );
        state.homePositions.push(
          ...new Array(desiredLength - state.homePositions.length).fill(null)
        );
      }
    },

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
     * Updates the takeoff headings of all the drones in the mission.
     */
    updateTakeoffHeadings(state, action) {
      // TODO(ntamas): synchronize the length of the mapping with it?
      // Or constrain the payload length to the length of the mapping?
      if (Array.isArray(action.payload)) {
        state.takeoffHeadings = copyAndEnsureLengthEquals(
          state.mapping.length,
          action.payload
        );
      } else {
        state.takeoffHeadings = new Array(state.mapping.length).fill(
          action.payload
        );
      }
    },
  },

  extraReducers: {
    REMOVE_FEATURES(state, action) {
      const { ids } = action.payload;
      if (ids.includes(state.geofencePolygonId)) {
        state.geofencePolygonId = undefined;
      }
    },
  },
});

export const {
  adjustMissionMapping,
  cancelMappingEditorSessionAtCurrentSlot,
  clearGeofencePolygonId,
  clearMapping,
  clearMappingSlot,
  commitMappingEditorSessionAtCurrentSlot,
  finishMappingEditorSession,
  removeUAVsFromMapping,
  replaceMapping,
  setCommandsAreBroadcast,
  setGeofencePolygonId,
  setMappingLength,
  startMappingEditorSession,
  startMappingEditorSessionAtSlot,
  togglePreferredChannel,
  updateHomePositions,
  updateLandingPositions,
  updateTakeoffHeadings,
} = actions;

export default reducer;
