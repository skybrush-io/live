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

    mappingEditor: {
      // Stores whether the mapping is currently being edited on the UI
      enabled: false,

      // Stores the index of the slot in the mapping that is being edited;
      // -1 if no slot is being edited
      indexBeingEdited: -1
    }
  },

  reducers: {
    adjustMissionMapping(state, action) {
      const { uavId, to } = action.payload;
      const from = state.mapping.indexOf(uavId);
      const uavIdToReplace = to === undefined ? undefined : state.mapping[to];

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
        state.mappingEditor.enabled = false;
        state.mappingEditor.indexBeingEdited = -1;
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
     * Starts the current editing session of the mapping, and marks the
     * given slot in the mapping as the one being edited.
     */
    startMappingEditorSessionAtSlot(state, action) {
      const tentativeIndex =
        typeof action.payload === 'number' ? action.payload : -1;
      const numItems = state.mapping.length;
      const index =
        tentativeIndex < 0 || tentativeIndex >= numItems ? -1 : tentativeIndex;

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
  startMappingEditorSessionAtSlot
} = actions;

export default reducer;
