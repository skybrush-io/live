/**
 * @file Slice of the state object that is responsible for storing the state
 * of the local Flockwave server and its discovery process.
 */

import { createSlice } from '@reduxjs/toolkit';

const { actions, reducer } = createSlice({
  name: 'localServer',

  initialState: {
    pathScan: {
      scanning: false,
      result: undefined,
      error: undefined
    },
    running: false
  },

  reducers: {
    notifyLocalServerExecutableSearchStarted(state) {
      state.pathScan.scanning = true;
      state.pathScan.result = undefined;
      state.pathScan.error = undefined;
    },

    notifyLocalServerExecutableSearchFinished(state, action) {
      state.pathScan.scanning = false;
      state.pathScan.result = action.payload;
      state.pathScan.error = undefined;
    },

    notifyLocalServerExecutableSearchFailed(state, action) {
      state.pathScan.scanning = false;
      state.pathScan.result = undefined;
      state.pathScan.error = action.payload;
    },

    startLocalServerExecutableSearch(state) {
      // Clearing both the result and the error of the pathScan part of
      // the state object will trigger the appropriate Redux saga to
      // start the scanning again
      state.pathScan.result = undefined;
      state.pathScan.error = undefined;
    }
  }
});

export const {
  notifyLocalServerExecutableSearchStarted,
  notifyLocalServerExecutableSearchFinished,
  notifyLocalServerExecutableSearchFailed,
  startLocalServerExecutableSearch
} = actions;

export default reducer;
