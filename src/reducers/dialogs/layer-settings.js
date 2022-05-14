/**
 * @file Reducer for handling the part of the state object that stores the
 * state of the layers dialog.
 */

import { createSlice } from '@reduxjs/toolkit';
import { noPayload } from '~/utils/redux';

const { actions, reducer } = createSlice({
  name: 'layer-settings',

  initialState: {
    dialogVisible: false,
    selectedLayer: undefined,
  },

  reducers: {
    showLayerSettingsDialog(state, { payload: layerId }) {
      state.dialogVisible = true;
      state.selectedLayer = layerId;
    },

    closeLayerSettingsDialog: noPayload((state) => {
      state.dialogVisible = false;
    }),
  },

  extraReducers: {
    REMOVE_LAYER(state, action) {
      if (state.selectedLayer === action.payload) {
        state.dialogVisible = false;
        state.selectedLayer = undefined;
      }
    },
  },
});

export const { showLayerSettingsDialog, closeLayerSettingsDialog } = actions;

export default reducer;
