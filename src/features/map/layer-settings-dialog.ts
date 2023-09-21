/**
 * @file Redux slice handling the part of the state object that stores the
 * state of the layers dialog.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import { removeLayer } from '~/features/map/layers';
import { type Layer } from '~/model/layers';
import { noPayload } from '~/utils/redux';

type LayerSettingsDialogSliceState = ReadonlyDeep<{
  dialogVisible: boolean;
  selectedLayer?: string;
}>;

const initialState: LayerSettingsDialogSliceState = {
  dialogVisible: false,
  selectedLayer: undefined,
};

const { actions, reducer } = createSlice({
  name: 'layer-settings-dialog',
  initialState,
  reducers: {
    showLayerSettingsDialog(
      state,
      { payload: layerId }: PayloadAction<Layer['id']>
    ) {
      state.dialogVisible = true;
      state.selectedLayer = layerId;
    },

    closeLayerSettingsDialog: noPayload<LayerSettingsDialogSliceState>(
      (state) => {
        state.dialogVisible = false;
      }
    ),
  },

  extraReducers(builder) {
    builder.addCase(removeLayer, (state, action) => {
      if (state.selectedLayer === action.payload) {
        state.dialogVisible = false;
        state.selectedLayer = undefined;
      }
    });
  },
});

export const { showLayerSettingsDialog, closeLayerSettingsDialog } = actions;

export default reducer;
