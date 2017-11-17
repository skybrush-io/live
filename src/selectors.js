import { isNil, reject } from 'lodash'
import { createSelector } from 'reselect'

import { globalIdToUavId } from './model/identifiers'
import { isLayerVisible } from './model/layers'

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
 * Helper function that takes an object with two keys: `byId` and `order`,
 * and returns objects from the values of `byId` according to the order
 * of keys passed in the `order` array.
 *
 * The typical use-case of this function is to select a subset of some
 * objects in the normalized state; e.g.: `selectOrdered(state.map.layers)`
 * will return the list of layers ordered according to the prescribed
 * layer ordering.
 *
 * However, note that this function on its own is not suitable to be used
 * directly by Redux because every re-render of the component using the
 * output of this function will get a *new* instance of the sorted and
 * filtered array, so they will re-render unconditionally. You need to
 * use this function as part of a selector instead; see, e.g.,
 * `getLayersInOrder()` and `getVisibleLayersInOrder()` instead.
 *
 * @return {Object[]} an array of values from the `byId` object, filtered
 *     and sorted according to the `order` array
 */
export const selectOrdered =
  ({ byId, order }) => (
    (order !== undefined)
      ? reject(order.map(id => byId[id]), isNil)
      : Object.values(byId)
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
