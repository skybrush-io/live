/**
 * @file Reducer function for handling the part of the state object that
 * corresponds to the global error dialog.
 */

import { handleActions } from 'redux-actions';

/**
 * Default content of the part of the state object that corresponds to the
 * error dialog.
 */
const defaultState = {
  open: false
};

/**
 * The reducer function that handles actions related to error messages and
 * the global error dialog.
 */
const reducer = handleActions(
  {
    CLOSE_ERROR_DIALOG: (state, action) => {
      return Object.assign({}, state, {
        open: false
      });
    },

    SHOW_ERROR_MESSAGE: (state, action) => {
      return Object.assign({}, state, {
        message: action.payload,
        open: true
      });
    }
  },
  defaultState
);

export default reducer;
