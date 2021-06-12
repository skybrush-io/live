import { createSelector } from '@reduxjs/toolkit';

import { isLayerVisible } from '~/model/layers';
import { selectOrdered } from '~/utils/collections';

/**
 * Selector that calculates and caches the list of all the connections that
 * the upstream server maintains to its auxiliary devices, in exactly the
 * same order as they should appear on the UI.
 */
export const getConnectionsInOrder = createSelector(
  (state) => state.connections,
  selectOrdered
);

/**
 * Selector that calculates and caches the list of all the features in the
 * state object, in exactly the same order as they should appear on the UI.
 */
export const getFeaturesInOrder = createSelector(
  (state) => state.features,
  selectOrdered
);

/**
 * Selector that calculates and caches the list of all the layers in the
 * state object, in exactly the same order as they should appear on the UI,
 * bottom layer first.
 */
export const getLayersInBottomFirstOrder = createSelector(
  (state) => state.map.layers,
  selectOrdered
);

/**
 * Selector that calculates and caches the list of all the layers in the
 * state object, in exactly the same order as they should appear on the UI,
 * top layer first.
 */
export const getLayersInTopmostFirstOrder = createSelector(
  getLayersInBottomFirstOrder,
  (layers) => layers.slice().reverse()
);

/**
 * Selector that calculates and caches the list of visible layers in the
 * state object, in exactly the same order as they should appear on the UI.
 */
export const getVisibleLayersInOrder = createSelector(
  getLayersInBottomFirstOrder,
  (layers) => layers.filter(isLayerVisible)
);
