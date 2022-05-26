/**
 * @file Redux slice for handling the part of the state object that
 * stores the state of the authentication dialog.
 */

import { createSlice } from '@reduxjs/toolkit';

/**
 * The reducer that handles actions related to the authentication dialog.
 */
const { actions, reducer } = createSlice({
  name: 'authentication',

  /**
   * The default state for the authentication dialog.
   */
  initialState: {
    lastError: undefined,
    open: false,
  },

  reducers: {
    authenticateToServerFulfilled(state, { payload }) {
      if (payload.result) {
        state.lastError = undefined;
        state.open = false;
      } else {
        state.lastError = payload.reason || 'Unexpected failure';
      }
    },

    authenticateToServerPending(state) {
      state.lastError = undefined;
    },

    /**
     * Action that closes the authentication dialog and cancels the current
     * authentication attempt.
     */
    closeAuthenticationDialog(state) {
      state.lastError = undefined;
      state.open = false;
    },

    /**
     * Action that opens the authentication dialog.
     */
    showAuthenticationDialog(state) {
      state.lastError = undefined;
      state.open = true;
    },
  },
});

export { reducer as default, actions };
