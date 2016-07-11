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
 * The reducer function that handles actions related to the tool selection.
 */
const reducer = handleActions({
  SELECT_MAP_SOURCE (state, action) {
    return u.updateIn('byId.base.parameters.source', action.payload, state)
  }
}, defaultState)

export default reducer
