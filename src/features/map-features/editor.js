/**
 * @file Redux slice for handling the part of the state object that
 * stores the state of the feature editor dialog.
 */

import { createSlice } from '@reduxjs/toolkit';

/**
 * The reducer that handles actions related to the server settings.
 */
const { reducer, actions } = createSlice({
  name: 'feature-editor',

  /**
   * The default settings for the part of the state object being defined here.
   */
  initialState: {
    dialogVisible: false,
    selectedTab: 'general',
  },

  reducers: {
    closeFeatureEditorDialog(state, action) {
      Object.assign(state, action.payload, { dialogVisible: false });
    },

    showFeatureEditorDialog(state, action) {
      state.dialogVisible = true;
      state.featureId = action.payload;
    },

    setFeatureEditorDialogTab(state, action) {
      state.selectedTab = action.payload;
    },
  },
});

export { reducer as default, actions };
