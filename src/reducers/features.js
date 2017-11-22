/**
 * @file Reducer function for handling the part of the state object that
 * stores the features (waypoints, tracks and areas) shown on the map.
 */

import { camelCase, capitalize, keys, map, mapValues } from 'lodash'
import { handleActions } from 'redux-actions'
import u from 'updeep'

import { FeatureType, getNameOfFeatureType } from '../model/features'
import { deleteByIds, getKey } from '../utils/collections'
import { translateBy } from '../utils/geography'
import { chooseUniqueId, chooseUniqueName } from '../utils/naming'

/**
 * Default content of the feature registry in the state object.
 */
const defaultState = {
  byId: {
    examplePolygon: {
      id: 'examplePolygon',
      type: FeatureType.POLYGON,
      points: [
        [ 19.061313, 47.474040 ],
        [ 19.063373, 47.473699 ],
        [ 19.063619, 47.471821 ],
        [ 19.061001, 47.471835 ]
      ],
      label: 'Test polygon',
      color: '#ffcc00'
    }
    /*
    examplePoint: {
      id: 'examplePoint',
      type: FeatureType.POINTS,
      points: [
        [ lon, lat ]
      ]
    },
    examplePointSet: {
      id: 'examplePointSet',
      type: FeatureType.POINTS,
      points: [
        [ lon, lat ],
        [ lon, lat ],
        [ lon, lat ],
        ...
      ]
    },
    examplePath: {
      id: 'examplePath',
      type: FeatureType.LINE_STRING,
      points: [
        [ lon, lat ],
        [ lon, lat ],
        [ lon, lat ],
        ...
      ]
    },
    exampleCircle: {
      id: 'exampleCircle',
      type: FeatureType.CIRCLE,
      // two points will define the circle exactly; the first one is the
      // center, the second one is an arbitrary point on the circumference
      // of the circle
      points: [
        [ lon, lat ],
        [ lon, lat ]
      ],
      color: '#ffcc00'
    },
    examplePolygon: {
      id: 'examplePolygon',
      type: FeatureType.POLYGON,
      points: [
        [ lon, lat ],
        [ lon, lat ],
        [ lon, lat ],
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
  },

  REMOVE_FEATURES (state, action) {
    const { ids } = action.payload
    return deleteByIds(ids, state)
  },

  RENAME_FEATURE (state, action) {
    const { id, name } = action.payload
    return u.updateIn(getKey(id, 'label'), name, state)
  },

  UPDATE_FEATURE_COORDINATES (state, action) {
    const { coordinates } = action.payload
    const updates = mapValues(coordinates,
      coordinate => ({ points: coordinate })
    )
    return u({ byId: u(updates) }, state)
  }
}, defaultState)

export default reducer
