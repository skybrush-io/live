/**
 * @file Slice of the state object that handles the state of the current
 * mission, i.e. a set of trajectories and commands that a group of UAVs must
 * perform, as well as a mapping from the mission-specific identifiers of
 * the UAVs to the real, physicaly identifiers of the UAVs that participate
 * in the mission.
 */

import { createSlice } from '@reduxjs/toolkit';

const { actions, reducer } = createSlice({
  name: 'mission',

  initialState: {
    // Stores a mapping from the mission-specific consecutive identifiers
    // to the IDs of the UAVs that participate in the mission with that
    // mission-specific identifier. The mapping may store UAV IDs and
    // undefined values for identifiers where the corresponding physical UAV
    // is not assigned yet.
    mapping: ['03', undefined, '01', '02', undefined],

    // Stores whether the mapping is currently being edited on the UI
    mappingIsEditable: false
  },

  reducers: {
    adjustMissionMapping(state, action) {
      const { uavId, to } = action.payload;
      const from = state.mapping.indexOf(uavId);
      const uavIdToReplace = to !== undefined ? state.mapping[to] : undefined;

      if (from >= 0) {
        state.mapping[from] = uavIdToReplace;
      }

      if (to !== undefined) {
        state.mapping[to] = uavId;
      }
    },

    /**
     * Clears the entire mission mapping.
     */
    clearMapping(state) {
      const numItems = state.mapping.length;
      state.mapping = new Array(numItems).fill(undefined);
    },

    /**
     * Clears a single slot in the mission mapping.
     */
    clearMappingSlot(state, action) {
      const index = action.payload;
      if (index >= 0 && index < length) {
        state.mapping[index] = undefined;
      }
    },

    /**
     * Finishes the current editing session of the mapping.
     */
    finishMappingEditorSession: {
      prepare: () => ({}), // this is to swallow event arguments
      reducer(state) {
        state.mappingIsEditable = false;
      }
    },

    /**
     * Removes a single UAV from the mission mapping.
     */
    removeUAVsFromMapping(state, action) {
      for (const uavId of action.payload) {
        const index = state.mapping.indexOf(uavId);
        if (index >= 0) {
          state.mapping[index] = undefined;
        }
      }
    },

    /**
     * Starts the current editing session of the mapping.
     */
    startMappingEditorSession: {
      prepare: () => ({}), // this is to swallow event arguments
      reducer(state) {
        state.mappingIsEditable = true;
      }
    },

    /**
     * Toggles whether the user is currently editing the mission mapping
     * or not.
     */
    toggleMappingIsEditable: {
      prepare: () => ({}), // this is to swallow event arguments
      reducer(state) {
        state.mappingIsEditable = !state.mappingIsEditable;
      }
    }
  }
});

export const {
  adjustMissionMapping,
  clearMapping,
  clearMappingSlot,
  finishMappingEditorSession,
  removeUAVsFromMission,
  startMappingEditorSession,
  toggleMappingIsEditable
} = actions;

export default reducer;
