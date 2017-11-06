/**
 * @file Reducer function for handling the part of the state object that
 * stores the features (waypoints, tracks and areas) shown on the map.
 */

import { handleActions } from 'redux-actions'

/**
 * Default content of the feature registry in the state object.
 */
const defaultState = {
  byId: {
    /*
    examplePoint: {
      type: 'point',
      coordinates: { lat: ..., lon: ... }
    },
    examplePointSet: {
      type: 'pointSet',
      points: [
        { lat: ..., lon: ... },
        { lat: ..., lon: ... },
        { lat: ..., lon: ... },
        ...
      ]
    },
    examplePath: {
      type: 'path',
      points: [
        { lat: ..., lon: ... },
        { lat: ..., lon: ... },
        { lat: ..., lon: ... },
        ...
      ]
    },
    examplePolygon: {
      type: 'polygon',
      points: [
        { lat: ..., lon: ... },
        { lat: ..., lon: ... },
        { lat: ..., lon: ... },
        ...
      ]
    }
    */
  },

  order: []
}

/**
 * The reducer function that handles actions related to the handling of
 * features on the map.
 */
const reducer = handleActions({
}, defaultState)

export default reducer
