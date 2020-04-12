/**
 * @file Reducer function for handling the part of the state object that
 * stores the state of the "Messages" dialog.
 */

import { handleActions } from 'redux-actions';

/**
 * The default settings for the part of the state object being defined here.
 */
const defaultState = {
  dialogVisible: false
};

/**
 * The reducer function that handles actions related to the server
 * settings.
 */
const reducer = handleActions(
  {
    SHOW_MESSAGES_DIALOG: (state) =>
      Object.assign({}, state, { dialogVisible: true }),

    CLOSE_MESSAGES_DIALOG: (state) =>
      Object.assign({}, state, { dialogVisible: false })
  },
  defaultState
);

export default reducer;
