/**
 * @file Reducer function for handling the part of the state object that
 * stores the state of saved locations. The location list includes the
 * current location that can be saved and any other Location
 * that the user has saved earlier.
 */

import { handleActions } from 'redux-actions'
import u from 'updeep'

/**
 * Default content of the saved location registry in the state object.
 */
const defaultState = {
  byId: {
    addNew: {
      id: 'addNew',
      name: 'Add a new location',
      center: {
        lon: 19.061951,
        lat: 47.473340
      },
      rotation: 0,
      zoom: 17
    },
    elte: {
      id: 'elte',
      name: 'ELTE Kert',
      center: {
        lon: 19.061951,
        lat: 47.473340
      },
      rotation: 0,
      zoom: 17
    },
    fahegy: {
      id: 'fahegy',
      name: 'Farkashegyi Repülőtér',
      center: {
        lon: 18.915125,
        lat: 47.486305
      },
      rotation: 59,
      zoom: 17
    },
    fina: {
      id: 'fina',
      name: 'FINA Launch',
      center: {
        lon: 19.048888,
        lat: 47.494545
      },
      rotation: 338,
      zoom: 19
    }
  },

  order: ['addNew', 'elte', 'fahegy', 'fina']
}

const idFromName = (byId, name, level = 0) => {
  const fixedName = name.replace(/[^a-z]/g, '') + '_'.repeat(level)
  return (fixedName in byId) ? idFromName(byId, name, level + 1) : fixedName
}

/**
 * The reducer function that handles actions related to the handling of
 * saved location states.
 */
const reducer = handleActions({
  UPDATE_SAVED_LOCATION: (state, action) => {
    const currentLocation = Object.assign({}, action.payload.savedLocation)

    let updates = {}

    if (currentLocation.id === 'current') {
      currentLocation.id = 'addNew'
      updates = { byId: { addNew: currentLocation } }
    } else if (currentLocation.id === 'addNew') {
      currentLocation.id = idFromName(state.byId, currentLocation.name)
      updates = {
        byId: { [currentLocation.id]: currentLocation },
        order: [].concat(state.order, currentLocation.id)
      }
    } else {
      updates = { byId: { [currentLocation.id]: currentLocation } }
    }

    return u(updates, state)
  },

  DELETE_SAVED_LOCATION: (state, action) => {
    const currentLocationId = action.payload.savedLocationId

    let updates = {}

    if (currentLocationId === 'addNew') {
      updates = {}
    } else {
      updates = {
        byId: u.omit(currentLocationId),
        order: u.reject(id => id === currentLocationId)
      }
    }

    return u(updates, state)
  }
}, defaultState)

export default reducer

