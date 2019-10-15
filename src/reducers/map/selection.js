/**
 * @file Reducer function for handling the set of selected features on the
 * map.
 */

import { difference, uniq } from 'lodash';
import { handleActions } from 'redux-actions';

import { uavIdToGlobalId } from '~/model/identifiers';

/**
 * The default state of the selection.
 */
const defaultState = [];

/**
 * Finds all the UAV features on the map.
 *
 * @param {Flock} flock the object that contains the drones
 *
 * @returns {string[]} array containing the feature identifiers
 */
function findAllUAVFeatures(flock) {
  return Object.keys(flock._uavsById).map(uavIdToGlobalId);
}

/**
 * Given an array containing a current selection, adds some items to
 * the selection and removes some items from it, then returns the same
 * selection object.
 *
 * It is assumed that removals happen first, and additions happen after
 * removals, in exactly the same order as the order in the list.
 *
 * @param  {string[]} current The current selection
 * @param  {string[]} add     The list of items to add
 * @param  {string[]} remove  The list of items to remove
 * @return {string[]} The updated selection. It will always be an
 *         object that is different (identity-wise) from the current
 *         selection (even if nothing changed), and it is guaranteed that
 *         items added later will be at lower indices in the array.
 */
function updateSelection(current, add, remove) {
  const result = difference(current, remove || []);

  if (add && add.length > 0) {
    result.splice(0, 0, ...add);
    return uniq(result);
  }

  return result;
}

/**
 * The reducer function that handles actions related to the snackbar.
 */
const reducer = handleActions(
  {
    ADD_FEATURES_TO_SELECTION(state, action) {
      return updateSelection(state, action.payload);
    },

    CLEAR_SELECTION() {
      return updateSelection([]);
    },

    REMOVE_FEATURES_FROM_SELECTION(state, action) {
      return updateSelection(state, [], action.payload);
    },

    SELECT_ALL_UAV_FEATURES(state, action) {
      return updateSelection([], findAllUAVFeatures(action.payload));
    },

    SET_SELECTED_FEATURES(state, action) {
      return updateSelection([], action.payload);
    }
  },
  defaultState
);

export default reducer;
