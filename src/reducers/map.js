/**
 * @file Reducer for the main map component in the app window.
 */

import { handleActions } from 'redux-actions'

/**
 * The default state of the map.
 */
const defaultState = {
  tools: {
    selectedTool: 'pan'
  }
}

/**
 * The reducer function that handles actions related to the snackbar.
 */
const reducer = handleActions({

  SELECT_MAP_TOOL (state, action) {
    const newToolState = Object.assign({}, state.tools, {
      selectedTool: action.payload
    })
    return Object.assign({}, state, {
      tools: newToolState
    })
  }

}, defaultState)

export default reducer
