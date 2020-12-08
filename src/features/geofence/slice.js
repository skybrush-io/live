/**
 * @file Reducer function for handling the part of the state object that
 * stores parameters for the automatic geofence generation process.
 */

import { createSlice } from '@reduxjs/toolkit';

import { noPayload } from '~/utils/redux';

import { MAX_VERTEX_COUNT } from './constants';

const { actions, reducer } = createSlice({
  name: 'geofence',

  initialState: {
    dialogVisible: false,

    horizontalMargin: 20,
    verticalMargin: 10,

    simplify: true,
    maxVertexCount: MAX_VERTEX_COUNT,
  },

  reducers: {
    showGeofenceSettingsDialog: noPayload((state) => {
      state.dialogVisible = true;
    }),

    closeGeofenceSettingsDialog: noPayload((state) => {
      state.dialogVisible = false;
    }),

    updateGeofenceSettings(state, { payload }) {
      Object.assign(state, payload);
    },
  },
});

export const {
  closeGeofenceSettingsDialog,
  showGeofenceSettingsDialog,
  updateGeofenceSettings,
} = actions;

export default reducer;
