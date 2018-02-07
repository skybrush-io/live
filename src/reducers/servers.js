/**
 * @file Reducer function for handling the part of the state object that
 * stores the detected servers in the local network.
 *
 * This feature works only from the Electron desktop app. The browser-based
 * version will attempt to make an educated guess based on the server URL.
 */

import { handleActions } from 'redux-actions'
import u from 'updeep'

/**
 * Default content of the list of detected servers in the state object.
 */
const defaultState = {
  byId: {},
  isScanning: false,
  order: []
}

/**
 * The reducer function that handles actions related to the list of detected
 * servers on the local network.
 */
const reducer = handleActions({
  ADD_DETECTED_SERVER: (state, action) => {
    const { hostName, port, type } = action.payload
    const key = `${hostName}:${port}:${type}`
    const item = {
      [key]: { id: key, hostName, port, type }
    }

    action.key = key
    action.wasAdded = false

    if (state.byId[key] !== undefined) {
      // Server already seen; just replace it
      return u({ byId: item }, state)
    } else {
      // Server not seen yet; add it to the end
      action.wasAdded = true
      return u({
        byId: item,
        order: [...state.order, key]
      }, state)
    }
  },

  REMOVE_ALL_DETECTED_SERVERS: (state, action) => ({
    byId: {},
    order: []
  }),

  START_SCANNING: (state, action) => u({ isScanning: true }, state),

  STOP_SCANNING: (state, action) => u({ isScanning: true }, state),

  UPDATE_DETECTED_SERVER_LABEL: (state, action) => {
    const { key, label } = action.payload
    const item = { [key]: { label } }
    if (state.byId[key] !== undefined) {
      // Server is still there, update the name
      return u({ byId: item }, state)
    } else {
      // Server was removed, don't do anything
      return state
    }
  }
}, defaultState)

export default reducer
