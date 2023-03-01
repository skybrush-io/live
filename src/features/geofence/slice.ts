/**
 * @file Reducer function for handling the part of the state object that
 * stores parameters for the automatic geofence generation process.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

type GeofenceSliceState = ReadonlyDeep<{
  horizontalMargin: number;
  verticalMargin: number;

  simplify: boolean;
  maxVertexCount: number;
}>;

const initialState: GeofenceSliceState = {
  horizontalMargin: 20,
  verticalMargin: 10,

  simplify: true,
  maxVertexCount: 10,
};

const { actions, reducer } = createSlice({
  name: 'geofence',
  initialState,
  reducers: {
    updateGeofenceSettings(
      state,
      {
        payload,
      }: PayloadAction<Partial<Omit<GeofenceSliceState, 'dialogVisible'>>>
    ) {
      Object.assign(state, payload);
    },
  },
});

export const { updateGeofenceSettings } = actions;

export default reducer;
