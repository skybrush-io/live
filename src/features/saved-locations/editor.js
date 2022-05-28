/**
 * @file Redux slice for handling the part of the state object that
 * stores the state of the saved location editor dialog.
 */

import { createSlice } from '@reduxjs/toolkit';

/**
 * The reducer function that handles actions related to the saved
 * locations dialog.
 */
const { actions, reducer } = createSlice({
  name: 'saved-location-editor',

  /**
   * The default settings for the part of the state object being defined here.
   */
  initialState: {
    dialogVisible: false,
    editedLocationId: undefined,
  },

  reducers: {
    _cancelLocationEditing(state) {
      state.dialogVisible = false;
      state.editedLocationId = undefined;
    },

    _closeSavedLocationEditorDialog(state) {
      state.dialogVisible = false;
    },

    /**
     * Action that will open the saved location editor dialog and set the
     * identifier of the currently edited location.
     *
     * @param {number} locationId  the identifier of the saved location to edit
     */
    editSavedLocation(state, { payload: locationId }) {
      state.dialogVisible = true;
      state.editedLocationId = locationId;
    },
  },
});

export { reducer as default, actions };
