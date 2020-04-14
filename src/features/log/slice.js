/**
 * @file Slice of the state object that handles the contents of the log window.
 */

import { createSlice } from '@reduxjs/toolkit';

const { actions, reducer } = createSlice({
  name: 'log',

  initialState: {
    highestUnseenMessageLevel: -1,
    items: [],
    nextId: 0,
    panelVisible: false,
  },

  reducers: {
    addLogItem(state, action) {
      const { message, module, level } = action.payload;
      const newItem = {
        id: state.nextId,
        timestamp: Date.now(),
        message: message || '',
        module: module || '',
        level: level || 0,
      };

      state.items.push(newItem);
      state.nextId += 1;

      if (!state.panelVisible && level !== undefined) {
        state.highestUnseenMessageLevel = Math.max(
          state.highestUnseenMessageLevel,
          level
        );
      }
    },

    clearLogItems(state) {
      state.items = [];
      state.highestUnseenMessageLevel = -1;
    },

    deleteLogItem(state, action) {
      const deletedItemId = action.payload;
      const index = state.items.find((item) => item.id === deletedItemId);
      if (index >= 0) {
        state.items.splice(index, 1);
      }
    },

    updateLogPanelVisibility(state, action) {
      state.panelVisible = Boolean(action.payload);

      if (state.panelVisible) {
        state.highestUnseenMessageLevel = -1;
      }
    },
  },
});

export const {
  addLogItem,
  clearLogItems,
  deleteLogItem,
  updateLogPanelVisibility,
} = actions;

export default reducer;
