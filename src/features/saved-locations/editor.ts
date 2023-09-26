/**
 * @file Redux slice for handling the part of the state object that
 * stores the state of the saved location editor dialog.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import { type SavedLocation } from './types';

type SavedLocationEditorSliceState = ReadonlyDeep<{
  dialogVisible: boolean;
  editedLocationId?: SavedLocation['id'];
}>;

/**
 * The default settings for the part of the state object being defined here.
 */
const initialState: SavedLocationEditorSliceState = {
  dialogVisible: false,
  editedLocationId: undefined,
};

/**
 * The reducer function that handles actions related to the saved
 * locations dialog.
 */
const { actions, reducer } = createSlice({
  name: 'saved-location-editor',
  initialState,
  reducers: {
    _cancelLocationEditing(state) {
      state.editedLocationId = undefined;
    },

    _closeSavedLocationEditorDialog(state) {
      state.dialogVisible = false;
    },

    /**
     * Action that will open the saved location editor dialog and set the
     * identifier of the currently edited location.
     */
    editSavedLocation(
      state,
      { payload: locationId }: PayloadAction<SavedLocation['id']>
    ) {
      state.dialogVisible = true;
      state.editedLocationId = locationId;
    },
  },
});

export { reducer as default, actions };
