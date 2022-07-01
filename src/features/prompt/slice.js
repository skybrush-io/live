/**
 * @file Redux slice for handling the part of the state object that
 * stores the state of the global prompt dialog that we (re)use for
 * single-line inputs (instead of `window.prompt`).
 */

import { createSlice } from '@reduxjs/toolkit';

const defaultState = {
  cancelButtonLabel: 'Cancel',
  dialogVisible: false,
  fieldType: 'text',
  hintText: undefined,
  message: undefined,
  submitButtonLabel: 'Submit',
  title: undefined,
};

/**
 * The reducer that handles actions related to the prompt dialog.
 */
const { reducer, actions } = createSlice({
  name: 'prompt',

  /**
   * The default settings for the part of the state object being defined here.
   */
  initialState: { ...defaultState },

  reducers: {
    /**
     * Action that closes the prompt dialog without submitting anything.
     *
     * This is not exported because the thunk version should be used instead.
     */
    _cancelPromptDialog(state) {
      state.dialogVisible = false;
    },

    /**
     * Action that will show the prompt dialog.
     * This is not exported because the thunk version should be used instead.
     */
    _showPromptDialog: {
      prepare: (message, options) => ({
        payload: {
          ...(typeof options === 'string'
            ? { initialValue: options }
            : options),
          message,
        },
      }),
      reducer: (state, action) =>
        // Nothing is kept from the previous state; this is intentional
        ({
          ...defaultState,
          ...action.payload,
          dialogVisible: true,
        }),
    },

    /**
     * Action that submits the prompt dialog with the given value.
     *
     * This is not exported because the thunk version should be used instead.
     */
    _submitPromptDialog(state) {
      state.dialogVisible = false;
    },
  },
});

export { reducer as default, actions };
