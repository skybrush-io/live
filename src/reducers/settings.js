/**
 * @file Reducer function for handling the part of the state object that
 * stores the application-specific settings of the user.
 */

import { handleActions } from 'redux-actions'
import u from 'updeep'

import { CoordinateFormat } from '../model/settings'

/**
 * Default set of application settings. This is a two-level key-value
 * store; the first level is the setting 'categories', the second level
 * is the actual settings.
 */
const defaultState = {
  display: {
    // Display format of coordinates
    coordinateFormat: CoordinateFormat.DEGREES,
    // Whether to show the mouse coordinates on the map
    showMouseCoordinates: true,
    // Whether to show the scale on the map
    showScaleLine: true
  },
  uavs: {
    // Number of seconds after which a UAV with no status updates is
    // marked by a warning state
    warnThreshold: 3,
    // Number of seconds after which a UAV with no status updates is
    // marked as gone
    goneThreshold: 60,
    // Number of seconds after which a UAV with no status updates is
    // removed from the UAV list
    forgetThreshold: 600
  }
}

/**
 * The reducer function that handles actions related to the settings.
 */
const reducer = handleActions({
  REPLACE_APP_SETTINGS: (state, action) => {
    const { category, updates } = action.payload

    if (state[category] === undefined) {
      return state
    } else {
      return u({ [category]: u.constant(updates) }, state)
    }
  },

  UPDATE_APP_SETTINGS: (state, action) => {
    const { category, updates } = action.payload

    if (state[category] === undefined) {
      return state
    } else {
      return u({ [category]: updates }, state)
    }
  }
}, defaultState)

export default reducer
