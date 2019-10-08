/**
 * @file Reducer for the sidebar component at the left edge of the
 * app window.
 */

import { handleActions } from 'redux-actions';

/**
 * The default state of the sidebar.
 */
const defaultState = {
  open: false
};

/**
 * The reducer function that handles actions related to the sidebar.
 */
const reducer = handleActions(
  {
    HIDE_SIDEBAR: (state, action) => Object.assign({}, state, { open: false }),

    SHOW_SIDEBAR: (state, action) => Object.assign({}, state, { open: true }),

    TOGGLE_SIDEBAR: (state, action) =>
      Object.assign({}, state, { open: !state.open })
  },
  defaultState
);

export default reducer;
