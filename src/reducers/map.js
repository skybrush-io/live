/**
 * @file Reducer for the main map component in the app window.
 */

import { handleActions } from 'redux-actions'

/**
 * The default state of the map.
 */
const defaultState = {
  selection: {},
  tools: {
    selectedTool: 'pan'
  }
}

/**
 * Given a dictionary containing a current selection, adds some items to
 * the selection and removes some items from it, then returns the same
 * selection object.
 *
 * Additions take precedence over removals.
 *
 * @param  {Object} current The current selection; each item in the selection
 *         is a key in the object and it should map to true. It will be
 *         mutated in place.
 * @param  {Array.<string>} add     The list of items to add
 * @param  {Array.<string>} remove  The list of items to remove
 * @return {Object} The same selection object
 */
function updateSelection (current, add, remove) {
  for (let item of remove) {
    delete current[item]
  }
  for (let item of add) {
    current[item] = true
  }
  return current
}

/**
 * The reducer function that handles actions related to the snackbar.
 */
const reducer = handleActions({

  ADD_SELECTED_FEATURES (state, action) {
    const newSelection = Object.assign({}, state.selection)
    return Object.assign({}, state, {
      selection: updateSelection(newSelection, action.payload)
    })
  },

  REMOVE_SELECTED_FEATURES (state, action) {
    const newSelection = Object.assign({}, state.selection)
    return Object.assign({}, state, {
      selection: updateSelection(newSelection, [], action.payload)
    })
  },

  SET_SELECTED_FEATURES (state, action) {
    return Object.assign({}, state, {
      selection: updateSelection({}, action.payload)
    })
  },

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
