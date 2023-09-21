/**
 * @file Redux slice for handling the part of the state object that
 * stores the state of the deauthentication dialog.
 */

import { createSlice } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

type DeauthenticationDialogSliceState = ReadonlyDeep<{
  open: boolean;
}>;

/**
 * The default state for the deauthentication dialog.
 */
const initialState: DeauthenticationDialogSliceState = {
  open: false,
};

/**
 * The reducer that handles actions related to the deauthentication dialog.
 */
const { actions, reducer } = createSlice({
  name: 'deauthentication-dialog',
  initialState,
  reducers: {
    /**
     * Action that closes the deauthentication dialog.
     */
    closeDeauthenticationDialog(state) {
      state.open = false;
    },

    /**
     * Action that opens the deauthentication dialog.
     */
    showDeauthenticationDialog(state) {
      state.open = true;
    },
  },
});

export { reducer as default, actions };
