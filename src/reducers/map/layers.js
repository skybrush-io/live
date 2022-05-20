/**
 * @file Slice for handling the layer configuration of the map.
 */

import camelCase from 'lodash-es/camelCase';
import map from 'lodash-es/map';

import { createSlice } from '@reduxjs/toolkit';

import {
  LayerType,
  createNewLayer,
  labelForLayerType,
  defaultParametersForLayerType,
} from '~/model/layers';
import { deleteItemById } from '~/utils/collections';
import { chooseUniqueId, chooseUniqueName } from '~/utils/naming';

/**
 * The reducer that handles actions related to map layers.
 */
const { reducer, actions } = createSlice({
  name: 'layers',

  /**
   * The default layer configuration of the map.
   */
  initialState: {
    byId: {
      base: createNewLayer('base', LayerType.BASE, 'Base map'),
      graticule: createNewLayer('graticule', LayerType.GRATICULE, 'Graticule'),
      beacons: createNewLayer('beacons', LayerType.BEACONS, 'Beacons'),
      features: createNewLayer('features', LayerType.FEATURES, 'Features'),
      home: createNewLayer('home', LayerType.MISSION_INFO, 'Mission info'),
      uavs: createNewLayer('uavs', LayerType.UAVS, 'UAVs'),
    },
    // .order contains the order of the layers, from bottom to top
    order: ['base', 'graticule', 'beacons', 'features', 'home', 'uavs'],
  },

  reducers: {
    /**
     * Add a new (typed or untyped) layer with the given name and type.
     *
     * @param {string?} name  the name of the layer to add; when omitted, a
     *        name will be generated automatically
     * @param {string?} type  the type of the layer to add; when omitted, the
     *        layer will be untyped and the user will be given an option to
     *        change its type
     */
    addLayer: {
      prepare: (name, type) => ({ payload: { name, type } }),
      reducer(state, action) {
        let { name } = action.payload;
        const { type } = action.payload;

        if (!type && !name) {
          // This would be an untyped layer and we would be free to choose its
          // name. This has to be handled in a special way: if there is already
          // an untyped layer in the layer list, just return the ID of that.
          for (const [layerId, layer] of Object.entries(state.byId)) {
            if (!layer.type || layer.type === LayerType.UNTYPED) {
              action.id = layerId;
              return;
            }
          }
        }

        if (!name) {
          // Generate a sensible name if no name was given
          const existingNames = map(state.byId, (layer) => layer.label);
          name = chooseUniqueName('New layer', existingNames);
        }

        // Create an ID from the camel-cased variant of the name and ensure
        // that it is unique
        const existingIds = Object.keys(state.byId);
        const id = chooseUniqueId(camelCase(name), existingIds);

        // Generate the new layer object
        // Leaving name empty for auto-labeling
        const newLayer = createNewLayer(id, type, '');

        // Store the ID of the layer that is about to be inserted on the
        // action so the caller of this action can decide what to do with it
        action.id = id;

        // Update the state
        state.byId[id] = newLayer;
        state.order.push(id);
      },
    },

    /**
     * Adjust the z-index of the layer with the given amount. Positive values
     * will bring the layer to the front; negative values will bring the layer
     * to the back.
     */
    adjustLayerZIndex: {
      prepare: (id, delta) => ({ payload: { id, delta } }),
      reducer(state, action) {
        const { id, delta } = action.payload;
        const { order } = state;
        const index = order.indexOf(id);
        const newIndex =
          index < 0
            ? -1
            : Math.max(0, Math.min(index + delta, order.length - 1));
        if (index >= 0 && newIndex >= 0) {
          order.splice(index, 1);
          order.splice(newIndex, 0, id);
        }

        return state;
      },
    },

    /**
     * Change the type of a currently untyped layer.
     *
     * Changing the type of a layer whose type is not <code>LayerType.UNTYPED</code>
     * is not supported at the moment. Trying to do so will yield an error.
     *
     * @param {string?} id    the ID of the layer whose type is to be changed
     * @param {string}  type  the new type of the layer
     */
    changeLayerType: {
      prepare: (id, type) => ({ payload: { id, type } }),
      reducer(state, action) {
        // Update the type of the layer and generate a new parameters object
        // for it
        const { id, type } = action.payload;
        if (state.byId[id].type === LayerType.UNTYPED) {
          const existingNames = map(state.byId, (layer) => layer.label);
          const suggestedName = chooseUniqueName(
            labelForLayerType(type),
            existingNames
          );
          const currentName = state.byId[id].label;

          const label = currentName === '' ? suggestedName : currentName;

          Object.assign(state.byId[id], {
            type,
            label,
            parameters: defaultParametersForLayerType(type),
            visible: true,
          });
        }

        console.warn(
          `Cannot change type of layer ${id} because it is not untyped`
        );
        return state;
      },
    },

    /**
     * Remove a layer.
     */
    removeLayer(state, { payload: layerId }) {
      deleteItemById(state, layerId);
    },

    /**
     * Rename a layer.
     *
     * @param {string} id    the ID of the layer to rename
     * @param {string} name  the new name of the layer
     */
    renameLayer: {
      prepare: (id, name) => ({ payload: { id, name } }),
      reducer(state, action) {
        const { id, name } = action.payload;
        state.byId[id].label = name;
      },
    },

    /**
     * Select a given source for the given map layer.
     */
    selectMapSource(state, action) {
      const { layerId, source } = action.payload;
      state.byId[layerId].parameters.source = source;
    },

    /**
     * Set a chosen parameter of the layer specified by the id.
     *
     * @param {string} id the ID of the layer whose parameter is to be changed
     * @param {string} parameter the parameter to change
     * @param {string} value the new value of the parameter
     */
    setLayerParameterById: {
      prepare: (layerId, parameter, value) => ({
        payload: { layerId, parameter, value },
      }),
      reducer(state, action) {
        const { layerId, parameter, value } = action.payload;
        state.byId[layerId].parameters[parameter] = value;
      },
    },

    /**
     * Set multiple parameters of the layer specified by the id.
     *
     * @param {string} id the ID of the layer whose parameter is to be changed
     * @param {object} parameters the parameter to change
     */
    setLayerParametersById: {
      prepare: (layerId, parameters) => ({ payload: { layerId, parameters } }),
      reducer(state, action) {
        Object.assign(
          state.byId[action.payload.layerId].parameters,
          action.payload.parameters
        );
      },
    },

    /**
     * Toggles the visibility of a layer with the given ID.
     *
     * @param {string} layerId  the ID of the layer whose visibility is to be
     *        modified
     */
    toggleLayerVisibility(state, action) {
      state.byId[action.payload].visible = !state.byId[action.payload].visible;
    },
  },
});

export { reducer as default, actions };
