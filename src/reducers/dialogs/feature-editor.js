/**
 * @file Reducer function for handling the part of the state object that
 * stores the state of the feature editor dialog.
 */

import { handleActions } from 'redux-actions';
import u from 'updeep';

/**
 * The default settings for the part of the state object being defined here.
 */
const defaultState = {
  dialogVisible: false,
  selectedTab: 'general',
};

/**
 * The reducer function that handles actions related to the server
 * settings.
 */
const reducer = handleActions(
  {
    SHOW_FEATURE_EDITOR_DIALOG: (state, action) =>
      u(
        {
          dialogVisible: true,
          featureId: action.payload,
        },
        state
      ),

    CLOSE_FEATURE_EDITOR_DIALOG: (state, action) =>
      u({ ...action.payload, dialogVisible: false }, state),

    SET_FEATURE_EDITOR_DIALOG_TAB: (state, action) =>
      u({ selectedTab: action.payload }, state),
  },
  defaultState
);

export default reducer;
