/**
 * @file Reducer for saving and storing the state of the main
 * workbench component.
 */

import { handleActions } from 'redux-actions';

/**
 * The default state of the workbench.
 */
const defaultState = {
  // Default workbench state is in src/workbench.js because the
  // Redux store only 'follows' the workbench state, it does not
  // define it in the usual sense (due to limitations in how
  // golden-layout works)
  state: undefined
};

/**
 * The reducer function that handles actions related to the workbench.
 */
const reducer = handleActions(
  {
    SAVE_WORKBENCH_STATE: (state, action) =>
      Object.assign({}, state, {
        state: action.payload
      })
  },
  defaultState
);

export default reducer;
