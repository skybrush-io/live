/**
 * @file Slice of the state object that handles the current information about
 * the weather.
 *
 * Weather info is periodically refreshed from the server. The state object
 * stores the last result that was retrieved, an error indicator and a flag
 * that denotes whether we are currently fetching new data. In case of an
 * error, the previous last result is still kept in the state object.
 */

import { createSlice } from '@reduxjs/toolkit';

const { actions, reducer } = createSlice({
  name: 'weather',

  initialState: {
    // Whether we are currently loading a new weather object
    loading: false,

    // Error during the last loading attempt
    error: null,

    // Data loaded during the last _successful_ loading attempt
    data: null,

    // Timestamp of the last loading attempt
    lastUpdateAttemptAt: null,

    // Timestamp of the last _successful_ loading attempt
    lastUpdatedAt: null,
  },

  reducers: {
    clearWeatherData(state) {
      state.data = null;
      state.error = null;
      state.lastUpdatedAt = null;
      state.lastUpdateAttemptAt = null;
    },
    loadingPromisePending(state) {
      state.loading = true;
    },
    loadingPromiseFulfilled(state, action) {
      state.data = action.payload;
      state.loading = false;
      state.error = null;
    },
    loadingPromiseRejected(state, action) {
      state.loading = false;
      state.error = action.payload;
    },
    setLastUpdateTimestamp(state, action) {
      state.lastUpdatedAt = Number(action.payload);
    },
    setLastUpdateAttemptTimestamp(state, action) {
      state.lastUpdateAttemptAt = Number(action.payload);
    },
  },
});

export const {
  clearWeatherData,
  setLastUpdateTimestamp,
  setLastUpdateAttemptTimestamp,
} = actions;

export default reducer;
