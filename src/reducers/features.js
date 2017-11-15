/**
 * @file Reducer function for handling the part of the state object that
 * stores the features (waypoints, tracks and areas) shown on the map.
 */

import { camelCase, capitalize, keys, map } from 'lodash'
import { handleActions } from 'redux-actions'
import u from 'updeep'

import { getNameOfFeatureType } from '../model/features'
import { chooseUniqueId, chooseUniqueName } from '../utils/naming'

/**
 * Default content of the feature registry in the state object.
 */
const defaultState = {
  byId: {
    examplePolygon: {
      id: 'examplePolygon',
      type: 'polygon',
      points: [
        { lat: 47.474040, lon: 19.061313 },
        { lat: 47.473699, lon: 19.063373 },
        { lat: 47.471821, lon: 19.063619 },
        { lat: 47.471835, lon: 19.061001 }
      ],
      color: '#ffcc00'
    }
    /*
    examplePoint: {
      id: 'examplePoint',
      type: 'points',
      points: [
        { lat: ..., lon: ... }
      ]
    },
    examplePointSet: {
      id: 'examplePointSet',
      type: 'points',
      points: [
        { lat: ..., lon: ... },
        { lat: ..., lon: ... },
        { lat: ..., lon: ... },
        ...
      ]
    },
    examplePath: {
      id: 'examplePath',
      type: 'lineString',
      points: [
        { lat: ..., lon: ... },
        { lat: ..., lon: ... },
        { lat: ..., lon: ... },
        ...
      ]
    },
    examplePolygon: {
      id: 'examplePolygon',
      type: 'polygon',
      points: [
        { lat: ..., lon: ... },
        { lat: ..., lon: ... },
        { lat: ..., lon: ... },
        ...
      ],
      color: '#ffcc00'
    }
    */
  },

  order: ['examplePolygon']
}

/**
 * The reducer function that handles actions related to the handling of
 * features on the map.
 */
const reducer = handleActions({
  ADD_FEATURE (state, action) {
    let { name, feature } = action.payload
    const { points, type } = feature

    if (!points || points.length < 1) {
      throw new Error('Feature must have at least one point')
    }

    if (!name) {
      // Generate a sensible name if no name was given
      const existingNames = map(state.byId, feature => feature.id)
      const nameBase = capitalize(getNameOfFeatureType(type))
      name = chooseUniqueName(nameBase, existingNames)
    }

    // Create an ID from the camel-cased variant of the name and ensure
    // that it is unique
    const existingIds = keys(state.byId)
    const id = chooseUniqueId(camelCase(name), existingIds)

    // Generate the new feature object by copying the argument
    const newFeature = {}
    newFeature[id] = JSON.parse(JSON.stringify(feature))
    newFeature[id].id = id

    // Store the ID of the feature that is about to be inserted on the
    // action so the caller of this action can decide what to do with it
    action.featureId = id

    // Update the state
    return u({
      byId: oldFeatures => Object.assign({}, oldFeatures, newFeature),
      order: oldOrder => [].concat(oldOrder, [id])
    }, state)
  }
}, defaultState)

export default reducer
