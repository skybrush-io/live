/**
 * @file Redux slice for handling the part of the state object that
 * corresponds to the global error dialog.
 */

import { createSlice } from '@reduxjs/toolkit';
import { noPayload } from '~/utils/redux';

import { errorToString } from '~/error-handling';

/**
 * The reducer that handles actions related to error messages and
 * the global error dialog.
 */
const { reducer, actions } = createSlice({
  name: 'error-handling',

  /**
   * Default content of the part of the state object that corresponds to the
   * error dialog.
   */
  initialState: {
    open: false,
  },

  reducers: {
    /**
     * Action that will hide the global error dialog if it is open.
     */
    closeErrorDialog: noPayload((state) => {
      state.open = false;
    }),

    /**
     * Action that will show the given error message in the global error dialog.
     */
    showErrorMessage: {
      prepare: (message, error) => ({
        payload:
          error instanceof Error
            ? `${message}: ` + errorToString(error)
            : message,
      }),
      reducer(state, action) {
        state.open = true;
        state.message = action.payload;
      },
    },
  },
});

export { reducer as default, actions };
