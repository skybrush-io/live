/**
 * @file Slice for handling the layer configuration of the map.
 */

import camelCase from 'lodash-es/camelCase';
import map from 'lodash-es/map';

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import {
  createNewLayer,
  defaultParametersForLayerType,
  labelForLayerType,
  type Layer,
  LayerType,
} from '~/model/layers';
import { type Source } from '~/model/sources';
import { type Collection, deleteItemById } from '~/utils/collections';
import { chooseUniqueId, chooseUniqueName } from '~/utils/naming';

type MapLayersSliceState = ReadonlyDeep<Collection<Layer>>;

/**
 * The default layer configuration of the map.
 */
const initialState: MapLayersSliceState = {
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
};

/**
 * The reducer that handles actions related to map layers.
 */
const { reducer, actions } = createSlice({
  name: 'layers',
  initialState,
  reducers: {
    /**
     * Add a new (typed or untyped) layer with the given name and type.
     *
     * @param name - The name of the layer to add; when omitted,
     *               a name will be generated automatically
     * @param type - The type of the layer to add; when omitted,
     *               the layer will be untyped and the user will
     *               be given an option to change its type
     */
    addLayer: {
      prepare: (name?: string, type?: LayerType) => ({
        payload: { name, type },
      }),
      reducer(
        state,
        action: PayloadAction<{ name?: string; type?: LayerType }>
      ) {
        let { name } = action.payload;
        const { type } = action.payload;

        if (!type && !name) {
          // This would be an untyped layer and we would be free to choose its
          // name. This has to be handled in a special way: if there is already
          // an untyped layer in the layer list, just return the ID of that.
          for (const [layerId, layer] of Object.entries(state.byId)) {
            if (!layer.type || layer.type === LayerType.UNTYPED) {
              // TODO: Make passing the `id` cleaner!
              (action as Record<string, unknown>)['id'] = layerId;
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
        // TODO: Make passing the `id` cleaner!
        (action as Record<string, unknown>)['id'] = id;

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
      prepare: (id: Layer['id'], delta: number) => ({ payload: { id, delta } }),
      reducer(
        state,
        action: PayloadAction<{ id: Layer['id']; delta: number }>
      ) {
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
     * Changing the type of a layer whose type is not `LayerType.UNTYPED`
     * is not supported at the moment. Trying to do so will yield an error.
     *
     * @param id - The ID of the layer whose type is to be changed
     * @param type - The new type of the layer
     */
    changeLayerType: {
      prepare: (id: Layer['id'], type: Layer['type']) => ({
        payload: { id, type },
      }),
      reducer(
        state,
        action: PayloadAction<{ id: Layer['id']; type: Layer['type'] }>
      ) {
        // Update the type of the layer and generate a new parameters object
        // for it
        const { id, type } = action.payload;
        const layer = state.byId[id];

        if (layer === undefined) {
          console.warn(`Cannot change type of non-existent layer ${id}`);
        } else if (layer.type === LayerType.UNTYPED) {
          const existingNames = map(state.byId, (layer) => layer.label);
          const suggestedName = chooseUniqueName(
            labelForLayerType(type),
            existingNames
          );
          const currentName = layer.label;

          const label = currentName === '' ? suggestedName : currentName;

          Object.assign(layer, {
            type,
            label,
            parameters: defaultParametersForLayerType(type),
            visible: true,
          });
        } else {
          console.warn(
            `Cannot change type of layer ${id} because it is not untyped`
          );
        }

        return state;
      },
    },

    /**
     * Remove a layer.
     */
    removeLayer(state, { payload: layerId }: PayloadAction<Layer['id']>) {
      deleteItemById(state, layerId);
    },

    /**
     * Rename a layer.
     *
     * @param id - The ID of the layer to rename
     * @param name - The new name of the layer
     */
    renameLayer: {
      prepare: (id: Layer['id'], name: Layer['label']) => ({
        payload: { id, name },
      }),
      reducer(
        state,
        action: PayloadAction<{ id: Layer['id']; name: Layer['label'] }>
      ) {
        const { id, name } = action.payload;
        const layer = state.byId[id];

        if (layer === undefined) {
          console.warn(`Cannot rename non-existent layer ${id}`);
        } else {
          layer.label = name;
        }
      },
    },

    /**
     * Select a given source for the given map layer.
     */
    selectMapSource(
      state,
      action: PayloadAction<{ layerId: Layer['id']; source: Source.Source }>
    ) {
      const { layerId, source } = action.payload;
      const layer = state.byId[layerId];

      if (layer === undefined) {
        console.warn(`Cannot set source of non-existent layer ${layerId}`);
      } else {
        layer.parameters['source'] = source;
      }
    },

    /**
     * Set a chosen parameter of the layer specified by the id.
     *
     * @param id - The ID of the layer whose parameter is to be changed
     * @param parameter - The parameter to change
     * @param value - The new value of the parameter
     */
    setLayerParameterById: {
      prepare: (layerId: Layer['id'], parameter: string, value: string) => ({
        payload: { layerId, parameter, value },
      }),
      reducer(
        state,
        action: PayloadAction<{
          layerId: Layer['id'];
          parameter: string;
          value: string;
        }>
      ) {
        const { layerId, parameter, value } = action.payload;
        const layer = state.byId[layerId];

        if (layer === undefined) {
          console.warn(`Cannot set parameter of non-existent layer ${layerId}`);
        } else {
          layer.parameters[parameter] = value;
        }
      },
    },

    /**
     * Set multiple parameters of the layer specified by the id.
     *
     * @param id - The ID of the layer whose parameter is to be changed
     * @param parameters - The parameter to change
     */
    setLayerParametersById: {
      prepare: (layerId: Layer['id'], parameters: Record<string, unknown>) => ({
        payload: { layerId, parameters },
      }),
      reducer(
        state,
        action: PayloadAction<{
          layerId: Layer['id'];
          parameters: Record<string, unknown>;
        }>
      ) {
        const { layerId, parameters } = action.payload;
        const layer = state.byId[layerId];

        if (layer === undefined) {
          console.warn(
            `Cannot set parameters of non-existent layer ${layerId}`
          );
        } else {
          Object.assign(layer.parameters, parameters);
        }
      },
    },

    /**
     * Toggles the visibility of a layer with the given ID.
     *
     * @param layerId - The ID of the layer whose visibility is to be modified
     */
    toggleLayerVisibility(state, { payload: id }: PayloadAction<Layer['id']>) {
      const layer = state.byId[id];

      if (layer === undefined) {
        console.warn(`Cannot toggle visibility of non-existent layer ${id}`);
      } else {
        layer.visible = !layer.visible;
      }
    },
  },
});

export const {
  addLayer,
  adjustLayerZIndex,
  changeLayerType,
  removeLayer,
  renameLayer,
  selectMapSource,
  setLayerParameterById,
  setLayerParametersById,
  toggleLayerVisibility,
} = actions;

export default reducer;
