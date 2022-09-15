/**
 * @file Slice of the state object that stores the status of the detachable
 * panels.
 */

import { createSlice } from '@reduxjs/toolkit';

const { actions, reducer } = createSlice({
  name: 'detachablePanels',

  initialState: {
    detachedPanels: [],
  },

  reducers: {
    attachPanel(state, { payload: panelName }) {
      const index = state.detachedPanels.findIndex((p) => p.name === panelName);
      if (index !== -1) {
        state.detachedPanels.splice(index, 1);
      }
    },

    detachPanel(state, { payload: panel }) {
      state.detachedPanels.push(panel);
    },
  },
});

export const { attachPanel, detachPanel } = actions;

export default reducer;
