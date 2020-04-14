/**
 * @file Reducer function for handling the part of the state object that
 * stores the state of the saved location editor dialog.
 */

import { handleActions } from 'redux-actions';

/**
 * The default settings for the part of the state object being defined here.
 */
const defaultState = {
  dialogVisible: false,
  editedLocationId: undefined,
};

/**
 * The reducer function that handles actions related to the saved
 * locations dialog.
 */
const reducer = handleActions(
  {
    EDIT_SAVED_LOCATION: (state, action) =>
      Object.assign({}, state, {
        dialogVisible: true,
        editedLocationId: action.payload.id,
      }),

    CANCEL_LOCATION_EDITING: (state, action) =>
      Object.assign({}, state, {
        dialogVisible: false,
        editedLocationId: undefined,
      }),
  },
  defaultState
);

export default reducer;
