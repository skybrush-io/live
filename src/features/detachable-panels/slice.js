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
    attachPanel(state, { payload: name }) {
      const index = state.detachedPanels.indexOf(name);
      if (index !== -1) {
        state.detachedPanels.splice(index, 1);
      }
    },

    detachPanel(state, { payload: name }) {
      state.detachedPanels.push(name);
    },
  },
});

export const { attachPanel, detachPanel } = actions;

export default reducer;
