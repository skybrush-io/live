/**
 * @file Slice of the state object that stores the status of the map caching
 * feature.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import { noPayload } from '~/utils/redux';

type MapCachingSliceState = ReadonlyDeep<{
  dialog: {
    open: boolean;
  };
  enabled: boolean;
}>;

const initialState: MapCachingSliceState = {
  dialog: {
    open: false,
  },
  enabled: false,
};

const { actions, reducer } = createSlice({
  name: 'mapCaching',
  initialState,
  reducers: {
    closeMapCachingDialog: noPayload<MapCachingSliceState>((state) => {
      state.dialog.open = false;
    }),

    showMapCachingDialog: noPayload<MapCachingSliceState>((state) => {
      state.dialog.open = true;
    }),

    setMapCachingEnabled(state, action: PayloadAction<boolean>) {
      state.enabled = Boolean(action.payload);
    },
  },
});

export const {
  closeMapCachingDialog,
  showMapCachingDialog,
  setMapCachingEnabled,
} = actions;

export default reducer;
