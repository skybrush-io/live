/**
 * @file Reducer function for handling the part of the state object that
 * stores the locations that the user has saved.
 */

import { handleActions } from 'redux-actions'

/**
 * Default content of the location registry in the state object.
 */
const defaultState = {
  // byId is a map from location ID to the location data
  byId: {
    elte: {
      id: 'elte',
      name: 'ELTE',
      rotation: 0,
      center: [19.061951, 47.473340],
      zoom: 17
    }
  },
  // order defines the preferred ordering of locations on the UI
  order: ['elte'],
  // lastVisitedId defines which of the locations was visited by the user
  // explicitly the last time
  lastVisitedId: undefined
}

/**
 * The reducer function that handles actions related to locations.
 */
const reducer = handleActions({
}, defaultState)

export default reducer
