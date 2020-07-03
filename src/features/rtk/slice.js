/**
 * @file Slice of the state object that stores data related to the currently
 * selected RTK stream on the server.
 */

import { createSlice } from '@reduxjs/toolkit';

const { actions, reducer } = createSlice({
  name: 'rtk',

  initialState: {
    stats: {
      // Carrier-to-noise ratio for satellites for which we have RTK correction data
      cnr: {},
      // RTCM messages recently processed by the server and their bandwidth requirement
      messages: {},
    },
  },

  reducers: {
    updateStatistics(state, action) {
      state.stats = action.payload;
    },
  },
});

export const { updateStatistics } = actions;

export default reducer;
