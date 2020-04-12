/**
 * @file Reducer function for handling the part of the state object that
 * stores the state of the deauthentication dialog.
 */

import { handleActions } from 'redux-actions';
import u from 'updeep';

/**
 * The default state for the deauthentication dialog.
 */
const defaultState = {
  open: false
};

/**
 * The reducer function that handles actions related to the deauthentication
 * dialog.
 */
const reducer = handleActions(
  {
    SHOW_DEAUTHENTICATION_DIALOG: (state) => u({ open: true }, state),

    CLOSE_DEAUTHENTICATION_DIALOG: (state) => u({ open: false }, state)
  },
  defaultState
);

export default reducer;
