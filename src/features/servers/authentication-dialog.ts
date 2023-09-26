/**
 * @file Redux slice for handling the part of the state object that
 * stores the state of the authentication dialog.
 */

import { type Response_AUTHRESP_SingleStep } from 'flockwave-spec';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

type AuthenticationDialogSliceState = ReadonlyDeep<{
  lastError?: string;
  open: boolean;
}>;

/**
 * The default state for the authentication dialog.
 */
const initialState: AuthenticationDialogSliceState = {
  lastError: undefined,
  open: false,
};

/**
 * The reducer that handles actions related to the authentication dialog.
 */
const { actions, reducer } = createSlice({
  name: 'authentication-dialog',
  initialState,
  reducers: {
    authenticateToServerFulfilled(
      state,
      { payload }: PayloadAction<Response_AUTHRESP_SingleStep>
    ) {
      if (payload.result) {
        state.lastError = undefined;
        state.open = false;
      } else {
        state.lastError = payload.reason ?? 'Unexpected failure';
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
