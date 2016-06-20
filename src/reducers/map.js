/**
 * @file Reducer for the main map component in the app window.
 */

import { handleActions } from 'redux-actions'

/**
 * The default state of the map.
 */
const defaultState = {
  sources: {
    visibleSource: 'osm'
  },
  selection: [],
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
 * @param  {string[]} current The current selection
 * @param  {string[]} add     The list of items to add
 * @param  {string[]} remove  The list of items to remove
 * @return {string[]} The updated selection. It will always be an
 *         object that is different (identity-wise) from the current
 *         selection and it will always be sorted.
 */
function updateSelection (current, add, remove) {
  const selectionAsSet = {}
  for (let item of current) {
    selectionAsSet[item] = true
  }
  if (remove) {
    for (let item of remove) {
      delete selectionAsSet[item]
    }
  }
  if (add) {
    for (let item of add) {
      selectionAsSet[item] = true
    }
  }
  return Object.keys(selectionAsSet).sort()
}

/**
 * The reducer function that handles actions related to the snackbar.
 */
const reducer = handleActions({

  ADD_SELECTED_FEATURES (state, action) {
    return Object.assign({}, state, {
      selection: updateSelection(state.selection, action.payload)
    })
  },

  CLEAR_SELECTED_FEATURES (state, action) {
    return Object.assign({}, state, {
      selection: updateSelection([])
    })
  },

  REMOVE_SELECTED_FEATURES (state, action) {
    return Object.assign({}, state, {
      selection: updateSelection(state.selection, [], action.payload)
    })
  },

  SET_SELECTED_FEATURES (state, action) {
    return Object.assign({}, state, {
      selection: updateSelection([], action.payload)
    })
  },

  SELECT_MAP_TOOL (state, action) {
    const newToolState = Object.assign({}, state.tools, {
      selectedTool: action.payload
    })
    return Object.assign({}, state, {
      tools: newToolState
    })
  },

  SELECT_MAP_SOURCE (state, action) {
    const newSourceState = Object.assign({}, state.sources, {
      visibleSource: action.payload
    })
    return Object.assign({}, state, {
      sources: newSourceState
    })
  }

}, defaultState)

export default reducer
