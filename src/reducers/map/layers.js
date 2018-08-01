/**
 * @file Reducer function for handling the layer configuration of the map.
 */

import { camelCase, keys, map } from 'lodash'
import { handleActions } from 'redux-actions'
import u from 'updeep'

import { LayerType, createNewLayer, labelForLayerType,
  defaultParametersForLayerType } from '../../model/layers'
import { deleteById, getKey } from '../../utils/collections'
import { chooseUniqueId, chooseUniqueName } from '../../utils/naming'

/**
 * The default layer configuration of the map.
 */
const defaultState = {
  // .byId contains all the layers in the map, in no particular order
  byId: {
    base: createNewLayer('base', LayerType.BASE, 'Base map'),
    features: createNewLayer('features', LayerType.FEATURES, 'Features'),
    home: createNewLayer('home', LayerType.HOME, 'Home position'),
    uavs: createNewLayer('uavs', LayerType.UAVS, 'UAVs')
  },
  // .order contains the order of the layers, from bottom to top
  order: ['base', 'features', 'home', 'uavs']
}

/**
 * The reducer function that handles actions related to the tool selection.
 */
const reducer = handleActions({
  ADD_LAYER (state, action) {
    let { name, type } = action.payload

    if (!name) {
      // Generate a sensible name if no name was given
      const existingNames = map(state.byId, layer => layer.label)
      name = chooseUniqueName('New layer', existingNames)
    }

    // Create an ID from the camel-cased variant of the name and ensure
    // that it is unique
    const existingIds = keys(state.byId)
    const id = chooseUniqueId(camelCase(name), existingIds)

    // Generate the new layer object
    const newLayer = {}
    // Leaving name empty for auto-labeling
    newLayer[id] = createNewLayer(id, type, '')

    // Store the ID of the layer that is about to be inserted on the
    // action so the caller of this action can decide what to do with it
    action.layerId = id

    // Update the state
    return u({
      byId: oldLayers => Object.assign({}, oldLayers, newLayer),
      order: oldOrder => [].concat(oldOrder, [id])
    }, state)
  },

  ADJUST_LAYER_Z_INDEX (state, action) {
    const { id, delta } = action.payload
    const { order } = state
    const index = order.indexOf(id)
    const newIndex = (index < 0) ? -1 : Math.max(0, Math.min(index + delta, order.length - 1))
    if (index >= 0 && newIndex >= 0) {
      const newOrder = [].concat(order)
      newOrder.splice(index, 1)
      newOrder.splice(newIndex, 0, id)
      return u({ order: newOrder }, state)
    } else {
      return state
    }
  },

  CHANGE_LAYER_TYPE (state, action) {
    // Update the type of the layer and generate a new parameters object
    // for it
    const layerUpdate = {}
    const { id, type } = action.payload
    if (state.byId[id].type === LayerType.UNTYPED) {
      const existingNames = map(state.byId, layer => layer.label)
      const suggestedName = chooseUniqueName(labelForLayerType(type), existingNames)
      const currentName = state.byId[id].label

      const label = currentName === '' ? suggestedName : currentName

      layerUpdate[id] = {
        type,
        label,
        parameters: () => defaultParametersForLayerType(type),
        visible: true
      }
      return u({ byId: layerUpdate }, state)
    } else {
      console.warn(`Cannot change type of layer ${id} because it is not untyped`)
      return state
    }
  },

  SET_LAYER_PARAMETER_BY_ID (state, action) {
    return u.updateIn(
      getKey(action.payload.layerId, 'parameters', action.payload.parameter),
      action.payload.value,
      state
    )
  },

  SET_LAYER_PARAMETERS_BY_ID (state, action) {
    return u.updateIn(
      getKey(action.payload.layerId, 'parameters'),
      action.payload.parameters,
      state
    )
  },

  REMOVE_LAYER (state, action) {
    const selectedLayer = action.payload
    return deleteById(selectedLayer, state)
  },

  RENAME_LAYER (state, action) {
    const { id, name } = action.payload
    return u.updateIn(getKey(id, 'label'), name, state)
  },

  SELECT_MAP_SOURCE (state, action) {
    const { layerId, source } = action.payload
    return u.updateIn(getKey(layerId, 'parameters.source'), source, state)
  },

  TOGGLE_LAYER_VISIBILITY (state, action) {
    return u.updateIn(
      getKey(action.payload, 'visible'),
      value => !value,
      state
    )
  }
}, defaultState)

export default reducer
