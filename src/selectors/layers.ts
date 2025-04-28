/**
 * @file Selectors that are related to the map layers.
 */

import { createSelector } from '@reduxjs/toolkit';
import mapValues from 'lodash-es/mapValues';

import {
  hasLicenseWithProFeatures,
  isConnected,
} from '~/features/servers/selectors';
import { type Layer, LayerType, ProLayerTypes } from '~/model/layers';
import type { AppSelector } from '~/store/reducers';
import type { Collection, Identifier } from '~/utils/collections';

/**
 * Selector that retrieves the list of layers on the map from the state object.
 *
 * @param state The state of the application.
 * @return The list of layers on the map.
 */
export const getLayers: AppSelector<Collection<Layer>> = (state) =>
  state.map.layers;

/**
 * Selector that retrieves the list of layers filtered by the currently active
 * license of the connected server.
 */
export const getLicensedLayers: AppSelector<Collection<Layer>> = createSelector(
  getLayers,
  isConnected,
  hasLicenseWithProFeatures,
  ({ order, byId }, isConnected, isProLicenseActive) => ({
    order,
    byId: isConnected
      ? mapValues(byId, (layer) =>
          ProLayerTypes.includes(layer.type) && !isProLicenseActive
            ? {
                id: layer.id,
                type: LayerType.UNAVAILABLE,
                label: layer.label,
                visible: false,
                parameters: {},
              }
            : layer
        )
      : byId, // Filtering is skipped if no server is connected.
  })
);

/**
 * Selector that retrieves a given layer by its identifier.
 *
 * @param id The identifier of the layer to get.
 * @return Object containing the properties of the selected layer.
 */
export const getLicensedLayerById = (id: Identifier) =>
  createSelector(
    getLicensedLayers,
    (layers): Layer | undefined => layers.byId[id]
  );
