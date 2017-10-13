/**
 * @file Reducer function for handling the part of the state object that
 * stores the state of the event log.
 */

import { handleActions } from 'redux-actions'

/**
 * Default content of the event log registry in the state object.
 */
const defaultState = [
  {
    level: 1,
    timestamp: new Date(),
    content: 'This is just a test message.'
  },
  {
    level: 2,
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    content: 'Something went wrong somewhere.'
  },
  {
    level: 0,
    timestamp: new Date(Date.now() - 1000 * 60 * 7),
    content: 'UAV takeoff message issued and response received.'
  },
  {
    level: 0,
    timestamp: new Date(Date.now() - 1000 * 60 * 7),
    content: 'UAV takeoff message issued and response received.'
  },
  {
    level: 0,
    timestamp: new Date(Date.now() - 1000 * 60 * 7),
    content: 'UAV takeoff message issued and response received.'
  }
]

/**
 * The reducer function that handles actions related to the handling of
 * the event log.
 */
const reducer = handleActions({
  ADD_LOG_ITEM: (state, action) => {
    return state.concat(action.payload)
  },

  DELETE_LOG_ITEM: (state, action) => {
    const itemId = action.payload

    return [].concat(state.slice(0, itemId), state.slice(itemId + 1))
  },

  CLEAR_LOG_ITEMS: (state, action) => {
    return []
  }
}, defaultState)

export default reducer

