import { createSelector } from 'reselect'

import { isLayerVisible } from '~/model/layers'
import { selectOrdered } from '~/utils/collections'

/**
 * Selector that calculates and caches the list of all the servers detected
 * on the local network, in exactly the same order as they should appear on
 * the UI.
 */
export const getDetectedServersInOrder = createSelector(
  state => state.servers.detected,
  selectOrdered
)

/**
 * Selector that calculates and caches the list of all the connections that
 * the upstream server maintains to its auxiliary devices, in exactly the
 * same order as they should appear on the UI.
 */
export const getConnectionsInOrder = createSelector(
  state => state.connections,
  selectOrdered
)

/**
 * Selector that calculates and caches the list of all the datasets that
 * we store in the state object, in exactly the same order as they should appear
 * on the UI.
 */
export const getDatasetsInOrder = createSelector(
  state => state.datasets,
  selectOrdered
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
