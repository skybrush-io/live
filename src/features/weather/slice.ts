/**
 * @file Slice of the state object that handles the current information about
 * the weather.
 *
 * Weather info is periodically refreshed from the server. The state object
 * stores the last result that was retrieved, an error indicator and a flag
 * that denotes whether we are currently fetching new data. In case of an
 * error, the previous last result is still kept in the state object.
 */

import { type WeatherInfo } from 'flockwave-spec';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

type WeatherSliceState = ReadonlyDeep<{
  /** Whether we are currently loading a new weather object */
  loading: boolean;

  /** Error during the last loading attempt */
  error?: string;

  /** Data loaded during the last _successful_ loading attempt */
  data?: WeatherInfo;

  /** Timestamp of the last loading attempt */
  lastUpdateAttemptAt?: number;

  /** Timestamp of the last _successful_ loading attempt */
  lastUpdatedAt?: number;
}>;

const initialState: WeatherSliceState = {
  loading: false,
  error: undefined,
  data: undefined,
  lastUpdateAttemptAt: undefined,
  lastUpdatedAt: undefined,
};

const { actions, reducer } = createSlice({
  name: 'weather',
  initialState,
  reducers: {
    clearWeatherData(state) {
      state.data = undefined;
      state.error = undefined;
      state.lastUpdatedAt = undefined;
      state.lastUpdateAttemptAt = undefined;
    },
    loadingPromisePending(state) {
      state.loading = true;
    },
    loadingPromiseFulfilled(state, action: PayloadAction<WeatherInfo>) {
      state.data = action.payload;
      state.loading = false;
      state.error = undefined;
    },
    loadingPromiseRejected: {
      prepare: (error: Error) => ({ payload: String(error) }),
      reducer(state, action: PayloadAction<string>) {
        state.loading = false;
        state.error = action.payload;
      },
    },
    setLastUpdateTimestamp(state, action: PayloadAction<number>) {
      state.lastUpdatedAt = Number(action.payload);
    },
    setLastUpdateAttemptTimestamp(state, action: PayloadAction<number>) {
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
