/**
 * @file Slice of the state object that stores the last known states of the
 * docking stations.
 */

import { createSlice } from '@reduxjs/toolkit';

const { actions, reducer } = createSlice({
  name: 'docks',

  initialState: {
    byId: {},
    order: []
  },

  reducers: {
    removeAll(state) {
      state.byId = {};
      state.order = [];
    }
  }
});

export const { removeAll } = actions;

export default reducer;
