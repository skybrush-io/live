/**
 * @file Reducer function for handling the part of the state object that
 * stores the state of saved locations. The location list includes the
 * current location that can be saved and any other Location
 * that the user has saved earlier.
 */

import { handleActions } from 'redux-actions'

/**
 * Default content of the saved location registry in the state object.
 */
const defaultState = {
  items: [
    {
      id: 0,
      name: 'Add a new location',
      center: {
        lon: 0,
        lat: 0
      },
      rotation: 0,
      zoom: 1
    },
    {
      id: 1,
      name: 'ELTE Kert',
      center: {
        lon: 19.061951,
        lat: 47.473340
      },
      rotation: 0,
      zoom: 17
    },
    {
      id: 2,
      name: 'FINA Launch',
      center: {
        lon: 19.048888,
        lat: 47.494545
      },
      rotation: 338,
      zoom: 19
    }
  ]
}

/**
 * The reducer function that handles actions related to the handling of
 * saved location states.
 */
const reducer = handleActions({
  UPDATE_SAVED_LOCATION: (state, action) => {
    const currentLocation = Object.assign({}, action.payload.savedLocation)

    let updatedItems = []

    if (currentLocation.id === 0) {
      currentLocation.id = state.items[state.items.length - 1].id + 1
      updatedItems = state.items.concat(currentLocation)
    } else {
      updatedItems = state.items.map(
        l => l.id === currentLocation.id ? currentLocation : l
      )
    }

    return Object.assign({}, state, {items: updatedItems})
  },

  DELETE_SAVED_LOCATION: (state, action) => {
    const currentLocationId = action.payload.savedLocationId

    let updatedItems = []

    if (currentLocationId === 0) {
      updatedItems = state.items
    } else {
      updatedItems = state.items.filter(
        l => l.id !== currentLocationId
      )
    }

    return Object.assign({}, state, {items: updatedItems})
  }
}, defaultState)

export default reducer
