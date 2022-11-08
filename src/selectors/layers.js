/**
 * @file Selectors that are related to the map layers.
 */

import mapValues from 'lodash-es/mapValues';
import { createSelector } from '@reduxjs/toolkit';

import {
  isConnected,
  hasLicenseWithProFeatures,
} from '~/features/servers/selectors.js';
import { LayerType, ProLayerTypes } from '~/model/layers';

/**
 * Selector that retrieves the list of layers on the map from the state object.
 *
 * @param {Object} state - the state of the application
 * @return {Object[]} the list of layers on the map
 */
export const getLayers = (state) => state.map.layers;

/**
 * Selector that retrieves the list of layers filtered by the currently active
 * license of the connected server.
 */
export const getLicensedLayers = createSelector(
  getLayers,
  isConnected,
  hasLicenseWithProFeatures,
  ({ order, byId }, isConnected, isProLicenseActive) => ({
    order,
    byId: isConnected
      ? mapValues(byId, (layer) =>
          ProLayerTypes.includes(layer.type) && !isProLicenseActive
            ? { id: layer.id, type: LayerType.UNAVAILABLE, label: layer.label }
            : layer
        )
      : byId, // Filtering is skipped if no server is connected.
  })
);

/**
 * Selector that retrieves a given layer by its identifier.
 *
 * @param {string} id - the identifier of the layer to get
 * @return {Object[]} object containing the properties of the selected layer
 */
export const getLicensedLayerById = (id) =>
  createSelector(getLicensedLayers, (layers) => layers.byId[id]);
