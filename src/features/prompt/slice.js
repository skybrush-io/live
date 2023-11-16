/**
 * @file Redux slice for handling the part of the state object that
 * stores the state of the global prompt dialog that we (re)use for
 * single-line inputs (instead of `window.prompt`).
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  open: false,

  initialValues: undefined,
  schema: undefined,
};

/**
 * The reducer that handles actions related to the prompt dialog.
 */
const { reducer, actions } = createSlice({
  name: 'prompt',

  /**
   * The default settings for the part of the state object being defined here.
   */
  initialState,

  reducers: {
    /**
     * Action that closes the prompt dialog without submitting anything.
     *
     * This is not exported because the thunk version should be used instead.
     */
    _cancelPromptDialog(state) {
      state.open = false;
    },

    /**
     * Action that will show the prompt dialog.
     * This is not exported because the thunk version should be used instead.
     */
    _showPromptDialog(state, { payload: { initialValues, schema } }) {
      state.open = true;

      state.initialValues = initialValues;
      state.schema = schema;
    },

    /**
     * Action that submits the prompt dialog with the given value.
     *
     * This is not exported because the thunk version should be used instead.
     */
    _submitPromptDialog(state) {
      state.open = false;
    },
  },
});

export { reducer as default, actions };
