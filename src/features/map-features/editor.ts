/**
 * @file Redux slice for handling the part of the state object that
 * stores the state of the feature editor dialog.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import { FeatureEditorTab, type FeatureProperties } from './types';

type FeatureEditorSliceState = ReadonlyDeep<{
  dialogVisible: boolean;
  featureId?: FeatureProperties['id'];
  selectedTab: FeatureEditorTab;
}>;

/**
 * The default settings for the part of the state object being defined here.
 */
const initialState: FeatureEditorSliceState = {
  dialogVisible: false,
  featureId: undefined,
  selectedTab: FeatureEditorTab.GENERAL,
};

/**
 * The reducer that handles actions related to the map feature editor dialog.
 */
const { reducer, actions } = createSlice({
  name: 'feature-editor',
  initialState,
  reducers: {
    closeFeatureEditorDialog(state) {
      state.dialogVisible = false;
    },

    showFeatureEditorDialog(
      state,
      action: PayloadAction<FeatureProperties['id']>
    ) {
      state.dialogVisible = true;
      state.featureId = action.payload;
    },

    setFeatureEditorDialogTab(state, action: PayloadAction<FeatureEditorTab>) {
      state.selectedTab = action.payload;
    },
  },
});

export { reducer as default, actions };
