/**
 * @file Reducer function for handling the set of selected features on the
 * map.
 */

import { handleActions } from 'redux-actions'

import { uavIdToGlobalId } from '../../model/identifiers'

/**
 * The default state of the selection.
 */
const defaultState = []

/**
 * Finds all the UAV features on the map.
 *
 * @param {Flock} flock the object that contains the drones
 *
 * @returns {string[]} array containing the feature identifiers
 */
function findAllUAVFeatures (flock) {
  return Object.keys(flock._uavsById).map(uavIdToGlobalId)
}

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
  for (const item of current) {
    selectionAsSet[item] = true
  }
  if (remove) {
    for (const item of remove) {
      delete selectionAsSet[item]
    }
  }
  if (add) {
    for (const item of add) {
      selectionAsSet[item] = true
    }
  }
  return Object.keys(selectionAsSet).sort()
}

/**
 * The reducer function that handles actions related to the snackbar.
 */
const reducer = handleActions({
  ADD_FEATURES_TO_SELECTION (state, action) {
    return updateSelection(state, action.payload)
  },

  CLEAR_SELECTION (state, action) {
    return updateSelection([])
  },

  REMOVE_FEATURES_FROM_SELECTION (state, action) {
    return updateSelection(state, [], action.payload)
  },

  SELECT_ALL_UAV_FEATURES (state, action) {
    return updateSelection([], findAllUAVFeatures(action.payload))
  },

  SET_SELECTED_FEATURES (state, action) {
    return updateSelection([], action.payload)
  }
}, defaultState)

export default reducer
