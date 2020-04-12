/**
 * @file Reducer function for handling the part of the state object that
 * stores the state of the authentication dialog.
 */

import { handleActions } from 'redux-actions';
import u from 'updeep';

/**
 * The default state for the authentication dialog.
 */
const defaultState = {
  lastError: undefined,
  open: false
};

/**
 * The reducer function that handles actions related to the authentication
 * dialog.
 */
const reducer = handleActions(
  {
    SHOW_AUTHENTICATION_DIALOG: (state) =>
      u({ lastError: undefined, open: true }, state),

    CLOSE_AUTHENTICATION_DIALOG: (state) =>
      u({ lastError: undefined, open: false }, state),

    AUTHENTICATE_TO_SERVER_PENDING: (state) =>
      u({ lastError: undefined }, state),

    AUTHENTICATE_TO_SERVER_FULFILLED: (state, action) => {
      const { payload } = action;
      return payload.result
        ? u({ lastError: undefined, open: false }, state)
        : u({ lastError: payload.reason || 'Unexpected failure' }, state);
    }
  },
  defaultState
);

export default reducer;
