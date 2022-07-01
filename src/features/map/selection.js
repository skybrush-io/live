/**
 * @file Reducer function for handling the set of selected features on the
 * map.
 */

import difference from 'lodash-es/difference';
import uniq from 'lodash-es/uniq';

import { createSlice } from '@reduxjs/toolkit';

import { removeFeaturesByIds } from '~/features/map-features/slice';
import flock from '~/flock';
import { featureIdToGlobalId, uavIdToGlobalId } from '~/model/identifiers';

/**
 * Finds all the UAV features on the map.
 *
 * @returns {string[]} array containing the feature identifiers
 */
function findAllUAVFeatures() {
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

const { actions, reducer } = createSlice({
  name: 'map/selection',
  initialState: [],

  reducers: {
    addFeaturesToSelection(state, action) {
      return updateSelection(state, action.payload);
    },

    clearSelection(state) {
      state.length = 0;
    },

    removeFeaturesFromSelection(state, action) {
      return updateSelection(state, [], action.payload);
    },

    selectAllUAVFeatures() {
      return updateSelection([], findAllUAVFeatures());
    },

    setSelectedFeatures(_state, action) {
      return updateSelection([], action.payload);
    },
  },

  extraReducers: {
    [removeFeaturesByIds](state, action) {
      return updateSelection(
        state,
        [],
        action.payload.map(featureIdToGlobalId).filter(Boolean)
      );
    },
  },
});

export const {
  addFeaturesToSelection,
  clearSelection,
  removeFeaturesFromSelection,
  selectAllUAVFeatures,
  setSelectedFeatures,
} = actions;

export default reducer;
