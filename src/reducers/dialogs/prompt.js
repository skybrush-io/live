/**
 * @file Reducer function for handling the part of the state object that
 * stores the state of the global prompt dialog that we (re)use for
 * single-line inputs (instead of `window.prompt`).
 */

import { handleActions } from 'redux-actions';
import u from 'updeep';

/**
 * The default settings for the part of the state object being defined here.
 */
const defaultState = {
  cancelButtonLabel: 'Cancel',
  dialogVisible: false,
  fieldType: 'text',
  hintText: undefined,
  message: undefined,
  submitButtonLabel: 'Submit',
  title: undefined
};

/**
 * The reducer function that handles actions related to the prompt dialog.
 */
const reducer = handleActions(
  {
    SHOW_PROMPT_DIALOG: (state, action) =>
      // Nothing is kept from the previous state; this is intentional
      ({
        ...defaultState,
        ...action.payload,
        dialogVisible: true
      }),

    SUBMIT_PROMPT_DIALOG: state =>
      u(
        {
          dialogVisible: false
        },
        state
      ),

    CANCEL_PROMPT_DIALOG: state =>
      u(
        {
          dialogVisible: false
        },
        state
      )
  },
  defaultState
);

export default reducer;
