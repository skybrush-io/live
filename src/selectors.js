import { isNil, reject } from 'lodash'
import { createSelector } from 'reselect'

import { globalIdToUavId } from './model/identifiers'
import { isLayerVisible } from './model/layers'

import { selectOrdered } from './utils/collections'

/**
 * Selector that retrieves the list of selected feature IDs from the
 * state object.
 *
 * @param  {Object}  state  the state of the application
 * @return {string[]}  the list of selected feature IDs
 */
export const getSelectedFeatureIds = state => state.map.selection

/**
 * Selector that calculates and caches the list of selected UAV IDs from
 * the state object.
 */
export const getSelectedUAVIds = createSelector(
  getSelectedFeatureIds,
  selectedFeatureIds => (
    reject(selectedFeatureIds.map(globalIdToUavId), isNil)
  )
)

/**
 * Selector that calculates and caches the list of all the features in the
 * state object, in exactly the same order as they should appear on the UI.
 */
export const getFeaturesInOrder = createSelector(
  state => state.features,
  selectOrdered
)

/**
 * Selector that calculates and caches the list of all the layers in the
 * state object, in exactly the same order as they should appear on the UI.
 */
export const getLayersInOrder = createSelector(
  state => state.map.layers,
  selectOrdered
)

/**
 * Selector that calculates and caches the list of visible layers in the
 * state object, in exactly the same order as they should appear on the UI.
 */
export const getVisibleLayersInOrder = createSelector(
  getLayersInOrder,
  layers => layers.filter(isLayerVisible)
)

/**
 * Selector that calculates and caches the list of all the saved locations
 * in the state object, in exactly the same order as they should appear on
 * the UI.
 */
export const getSavedLocationsInOrder = createSelector(
  state => state.savedLocations,
  selectOrdered
)
