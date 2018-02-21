/**
 * @file Reducer function for handling the part of the state object that
 * stores the state of the event log.
 */

import { handleActions } from 'redux-actions'
import u from 'updeep'

/**
 * Default content of the event log registry in the state object.
 */
const defaultState = {
  items: [
    {
      id: 0,
      level: 10,
      timestamp: Date.now() - 1000 * 60 * 7 - 3,
      message: 'Information log entry #1.'
    },
    {
      id: 1,
      level: 10,
      timestamp: Date.now() - 1000 * 60 * 7 - 2,
      message: 'Information log entry #2.'
    },
    {
      id: 2,
      level: 10,
      timestamp: Date.now() - 1000 * 60 * 7 - 1,
      message: 'Information log entry #3.'
    },
    {
      id: 3,
      level: 30,
      timestamp: Date.now() - 1000 * 60 * 5,
      message: 'Something went wrong somewhere.'
    },
    {
      id: 4,
      level: 20,
      timestamp: Date.now(),
      message: 'This is just a test message.'
    }
  ],
  highestUnseenMessageLevel: -1,
  nextId: 5,
  panelVisible: false
}

/**
 * The reducer function that handles actions related to the handling of
 * the event log.
 */
const reducer = handleActions({
  ADD_LOG_ITEM: (state, action) => {
    const { message, level } = action.payload
    const newItem = {
      id: state.nextId,
      timestamp: Date.now(),
      message: message || '',
      level: level || 0
    }
    const updates = {
      items: [...state.items, newItem],
      nextId: state.nextId + 1
    }
    if (!state.panelVisible && level !== undefined) {
      updates.highestUnseenMessageLevel = Math.max(
        state.highestUnseenMessageLevel, level
      )
    }
    return u(updates, state)
  },

  DELETE_LOG_ITEM: (state, action) => {
    const deletedItemId = action.payload
    return u({
      items: u.reject(item => item.id === deletedItemId)
    }, state)
  },

  CLEAR_LOG_ITEMS: (state, action) => {
    return u({
      items: [],
      highestUnseenMessageLevel: -1
    }, state)
  },

  UPDATE_LOG_PANEL_VISIBILITY: (state, action) => {
    const updates = {
      panelVisible: action.payload
    }
    if (action.payload) {
      updates.highestUnseenMessageLevel = -1
    }
    return u(updates, state)
  }
}, defaultState)

export default reducer
