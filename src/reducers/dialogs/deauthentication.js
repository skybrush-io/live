/**
 * @file Redux slice for handling the part of the state object that
 * stores the state of the deauthentication dialog.
 */

import { createSlice } from '@reduxjs/toolkit';

/**
 * The reducer that handles actions related to the deauthentication dialog.
 */
const { actions, reducer } = createSlice({
  name: 'deauthentication',

  /**
   * The default state for the deauthentication dialog.
   */
  initialState: {
    open: false,
  },

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
