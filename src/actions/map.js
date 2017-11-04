/**
 * @file Action factories related to the map in the main app window.
 */

import { createAction } from 'redux-actions'
import { SELECT_MAP_TOOL, ADD_SELECTED_FEATURES, SELECT_ALL_FEATURES,
  CLEAR_SELECTED_FEATURES, SET_SELECTED_FEATURES, REMOVE_SELECTED_FEATURES,
  SELECT_MAP_SOURCE } from './types'

import { uavIdToFeatureId } from '../model/identifiers'

/**
 * Action factory that creates an action that selects a given source in the
 * map toolbar.
 */
export const selectMapSource = createAction(SELECT_MAP_SOURCE)

/**
 * Action factory that creates an action that selects a given tool in the
 * map toolbar.
 */
export const selectMapTool = createAction(SELECT_MAP_TOOL)

/**
 * Action factory that creates an action that adds a set of selected
 * features to the existing selection in the map.
 *
 * @param {Array.<string>} ids  the IDs of the newly selected features to
 *        add to the existing selection.
 */
export const addSelectedFeatures = createAction(ADD_SELECTED_FEATURES)

/**
 * Action factory that creates an action that selects all the selectable
 * features on the map.
 */
export const selectAllFeatures = createAction(SELECT_ALL_FEATURES)

/**
 * Action factory that creates an action that clears the set of selected
 * features in the map.
 */
export const clearSelectedFeatures = createAction(CLEAR_SELECTED_FEATURES)

/**
 * Action factory that creates an action that removes a set of selected
 * features from the existing selection in the map.
 *
 * @param {Array.<string>} ids  the IDs of the features to remove from the
 *        existing selection.
 */
export const removeSelectedFeatures = createAction(REMOVE_SELECTED_FEATURES)

/**
 * Action factory that creates an action that sets the set of selected
 * features in the map.
 *
 * @param {Array.<string>} ids  the IDs of the selected features. Any
 *        feature whose ID is not in this set will be deselected.
 */
export const setSelectedFeatures = createAction(SET_SELECTED_FEATURES)

/**
 * Action factory that creates an action that sets the set of selected
 * UAV IDs in the map.
 *
 * @param {Array.<string>} ids  the IDs of the selected UAVs. Any UAV
 *        whose ID is not in this set will be deselected, and so will be
 *        any feature that is not an UAV.
 * @return {Object} an appropriately constructed action
 */
export const setSelectedUAVIds =
  ids => setSelectedFeatures(ids.map(uavIdToFeatureId))
