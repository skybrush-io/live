/**
 * @file Reducer function for handling the part of the state object that
 * stores parameters for the automatic geofence generation process.
 */

import { createSlice } from '@reduxjs/toolkit';

const { actions, reducer } = createSlice({
  name: 'geofence',

  initialState: {
    horizontalMargin: 20,
    verticalMargin: 10,

    simplify: true,
    maxVertexCount: 10,
  },

  reducers: {
    updateGeofenceSettings(state, { payload }) {
      Object.assign(state, payload);
    },
  },
});

export const { updateGeofenceSettings } = actions;

export default reducer;
