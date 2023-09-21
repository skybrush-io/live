/**
 * @file Reducer function for handling the part of the state object that
 * stores parameters for the automatic geofence generation process.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import { noPayload } from '~/utils/redux';

import { MAX_VERTEX_COUNT } from './constants';

type GeofenceSliceState = ReadonlyDeep<{
  dialogVisible: boolean;

  horizontalMargin: number;
  verticalMargin: number;

  simplify: boolean;
  maxVertexCount: number;
}>;

const initialState: GeofenceSliceState = {
  dialogVisible: false,

  horizontalMargin: 20,
  verticalMargin: 10,

  simplify: true,
  maxVertexCount: MAX_VERTEX_COUNT,
};

const { actions, reducer } = createSlice({
  name: 'geofence',
  initialState,
  reducers: {
    showGeofenceSettingsDialog: noPayload<GeofenceSliceState>((state) => {
      state.dialogVisible = true;
    }),

    closeGeofenceSettingsDialog: noPayload<GeofenceSliceState>((state) => {
      state.dialogVisible = false;
    }),

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

export const {
  closeGeofenceSettingsDialog,
  showGeofenceSettingsDialog,
  updateGeofenceSettings,
} = actions;

export default reducer;
