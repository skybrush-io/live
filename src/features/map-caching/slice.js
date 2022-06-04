/**
 * @file Slice of the state object that stores the status of the map caching
 * feature.
 */

import { createSlice } from '@reduxjs/toolkit';

import { noPayload } from '~/utils/redux';

const { actions, reducer } = createSlice({
  name: 'mapCaching',

  initialState: {
    dialog: {
      open: false,
    },
    enabled: false,
  },

  reducers: {
    closeMapCachingDialog: noPayload((state) => {
      state.dialog.open = false;
    }),

    showMapCachingDialog: noPayload((state) => {
      state.dialog.open = true;
    }),

    setMapCachingEnabled(state, action) {
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
