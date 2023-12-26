/**
 * @file Slice of the state object that is responsible for storing the state
 * of the local Skybrush server and its discovery process.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import { noPayload } from '~/utils/redux';

type LocalServerSliceState = ReadonlyDeep<{
  pathScan: {
    scanning: boolean;
    result?: string;
    error?: string;
  };
  running: boolean;
}>;

const initialState: LocalServerSliceState = {
  pathScan: {
    scanning: false,
    result: undefined,
    error: undefined,
  },
  running: false,
};

const { actions, reducer } = createSlice({
  name: 'localServer',
  initialState,
  reducers: {
    notifyLocalServerExecutableSearchStarted(state) {
      state.pathScan.scanning = true;
      state.pathScan.result = undefined;
      state.pathScan.error = undefined;
    },

    notifyLocalServerExecutableSearchFinished(
      state,
      action: PayloadAction<string>
    ) {
      state.pathScan.scanning = false;
      state.pathScan.result = action.payload;
      state.pathScan.error = undefined;
    },

    notifyLocalServerExecutableSearchFailed(
      state,
      action: PayloadAction<string>
    ) {
      state.pathScan.scanning = false;
      state.pathScan.result = undefined;
      state.pathScan.error = action.payload;
    },

    startLocalServerExecutableSearch: noPayload<LocalServerSliceState>(
      (state) => {
        // Clearing both the result and the error of the pathScan part of
        // the state object will trigger the appropriate Redux saga to
        // start the scanning again
        state.pathScan.result = undefined;
        state.pathScan.error = undefined;
      }
    ),
  },
});

export const {
  notifyLocalServerExecutableSearchStarted,
  notifyLocalServerExecutableSearchFinished,
  notifyLocalServerExecutableSearchFailed,
  startLocalServerExecutableSearch,
} = actions;

export default reducer;
