/**
 * @file Reducer function for handling the layer configuration of the map.
 */

import { handleActions } from 'redux-actions'
import u from 'updeep'

import { LayerType } from '../../model/layers'

/**
 * The default layer configuration of the map.
 */
const defaultState = {
  // .byId contains all the layers in the map, in no particular order
  byId: {
    base: {
      // Each layer has a type, a label, a visibility flag and some
      // (type-dependent) parameters. The values of the type parameter
      // should come from the LayerType enum.
      //
      // LayerType.BASE is the base layer that contains the map itself.
      type: LayerType.BASE,
      label: 'Base map',
      visible: true,
      parameters: {
        // We use the OSM data source for the base layer by default
        source: 'osm'
      }
    },
    uavs: {
      // This layer shows all the UAVs in the flock
      type: LayerType.UAVS,
      label: 'UAVs',
      visible: true,
      parameters: {}
    }
  },
  // .order contains the order of the layers, from bottom to top
  order: ['base', 'uavs']
}

/**
 * Creates a string key that can be used in a call to <code>u.updateIn</code>
 * to update some properties of a layer.
 *
 * @param  {string}  layerId  the ID of the layer
 * @param  {string?} subKey   optional sub-key that will be appended to the
 *         returned key if you want to update some deeply nested property
 *         of the selected layer
 * @return {string}  an updeep key that corresponds to the layer with the
 *         given ID
 */
const getLayerKey = (layerId, subKey) => {
  if (layerId.indexOf('.') !== -1) {
    throw new Error('Layer ID cannot contain dots')
  }

  return subKey ? `byId.${layerId}.${subKey}` : `byId.${layerId}`
}

/**
 * The reducer function that handles actions related to the tool selection.
 */
const reducer = handleActions({
  RENAME_LAYER (state, action) {
    const { id, name } = action.payload
    return u.updateIn(getLayerKey(id, 'label'), name, state)
  },

  SELECT_MAP_SOURCE (state, action) {
    return u.updateIn(getLayerKey('base', 'parameters.source'),
                      action.payload, state)
  },

  TOGGLE_LAYER_VISIBILITY (state, action) {
    return u.updateIn(getLayerKey(action.payload, 'visible'),
                      value => !value, state)
  }
}, defaultState)

export default reducer
