/**
 * @file Slice of the state object that stores the settings of the current drone
 * show being executed.
 */

import { createSlice } from '@reduxjs/toolkit';

import { noPayload } from '~/utils/redux';

const { actions, reducer } = createSlice({
  name: 'show',

  initialState: {
    data: null,
    environment: {
      editing: false,
      outdoor: {
        coordinateSystem: {
          orientation: '0', // stored as a string to avoid rounding errors
          origin: null
        }
      },
      type: 'outdoor'
    },
    loading: false
  },

  reducers: {
    clearLoadedShow: noPayload(state => {
      state.data = null;
    }),

    closeEnvironmentEditorDialog: noPayload(state => {
      state.environment.editing = false;
    }),

    loadingPromisePending(state) {
      state.loading = true;
    },

    loadingPromiseFulfilled(state, action) {
      state.data = action.payload;
      state.loading = false;
    },

    loadingPromiseRejected(state) {
      state.loading = false;
    },

    openEnvironmentEditorDialog: noPayload(state => {
      state.environment.editing = true;
    }),

    setEnvironmentType(state, action) {
      state.environment.type = action.payload;
    },

    setOutdoorShowOrientation(state, action) {
      state.environment.outdoor.coordinateSystem.orientation = String(
        action.payload
      );
    },

    setOutdoorShowOrigin(state, action) {
      state.environment.outdoor.coordinateSystem.origin =
        action.payload || null;
    }
  }
});

export const {
  clearLoadedShow,
  closeEnvironmentEditorDialog,
  openEnvironmentEditorDialog,
  setEnvironmentType,
  setOutdoorShowOrientation,
  setOutdoorShowOrigin
} = actions;

export default reducer;
