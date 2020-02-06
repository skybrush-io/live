/**
 * @file Slice of the state object that stores the settings of the current drone
 * show being executed.
 */

import { createSlice } from '@reduxjs/toolkit';

const { actions, reducer } = createSlice({
  name: 'show',

  initialState: {
    data: null,
    loading: false
  },

  reducers: {
    clearLoadedShow: {
      prepare: () => ({}),
      reducer(state) {
        state.data = null;
      }
    },

    loadingPromisePending(state) {
      state.loading = true;
    },

    loadingPromiseFulfilled(state, action) {
      state.data = action.payload;
      state.loading = false;
    },

    loadingPromiseRejected(state) {
      state.loading = false;
    }
  }
});

export const { clearLoadedShow } = actions;

export default reducer;
