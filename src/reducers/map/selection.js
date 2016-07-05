/**
 * @file Reducer function for handling the set of selected features on the
 * map.
 */

import { handleActions } from 'redux-actions'

/**
 * The default state of the selection.
 */
const defaultState = []

/**
 * Given an array containing a current selection, adds some items to
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
    return updateSelection(state, action.payload)
  },

  CLEAR_SELECTED_FEATURES (state, action) {
    return updateSelection([])
  },

  REMOVE_SELECTED_FEATURES (state, action) {
    return updateSelection(state, [], action.payload)
  },

  SET_SELECTED_FEATURES (state, action) {
    return updateSelection([], action.payload)
  }
}, defaultState)

export default reducer
