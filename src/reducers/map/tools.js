/**
 * @file Reducer function for handling the selected tool on the map.
 */

import { handleActions } from 'redux-actions';

/**
 * The default selected tool.
 */
const defaultState = {
  selectedTool: 'select',
};

/**
 * The reducer function that handles actions related to the tool selection.
 */
const reducer = handleActions(
  {
    SELECT_MAP_TOOL(state, action) {
      return Object.assign({}, state, {
        selectedTool: action.payload,
      });
    },
  },
  defaultState
);

export default reducer;
