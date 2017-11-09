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
      type: 'point',
      coordinates: { lat: ..., lon: ... }
    },
    examplePointSet: {
      id: 'examplePointSet',
      type: 'pointSet',
      points: [
        { lat: ..., lon: ... },
        { lat: ..., lon: ... },
        { lat: ..., lon: ... },
        ...
      ]
    },
    examplePath: {
      id: 'examplePath',
      type: 'path',
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
}, defaultState)

export default reducer
