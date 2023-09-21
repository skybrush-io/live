/**
 * @file Redux slice for handling the part of the state object that
 * corresponds to the global error dialog.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import { noPayload } from '~/utils/redux';

type ErrorHandlingSliceState = ReadonlyDeep<{
  message?: string;
  open: boolean;
}>;

/**
 * Default content of the part of the state object that corresponds to the
 * error dialog.
 */
const initialState: ErrorHandlingSliceState = {
  message: undefined,
  open: false,
};

/**
 * The reducer that handles actions related to error messages and
 * the global error dialog.
 */
const { reducer, actions } = createSlice({
  name: 'error-handling',
  initialState,
  reducers: {
    /**
     * Action that will hide the global error dialog if it is open.
     */
    closeErrorDialog: noPayload<ErrorHandlingSliceState>((state) => {
      state.open = false;
    }),

    /**
     * Action that will show the given error message in the global error dialog.
     */
    showErrorMessage: {
      prepare: (message: string, error?: Error) => ({
        payload:
          error instanceof Error ? `${message}: ` + String(error) : message,
      }),
      reducer(state, action: PayloadAction<string>) {
        state.message = action.payload;
        state.open = true;
      },
    },
  },
});

export { reducer as default, actions };
