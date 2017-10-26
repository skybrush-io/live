/**
 * @file Reducer function for handling the part of the state object that
 * stores the state of the event log.
 */

import { handleActions } from 'redux-actions'

/**
 * Default content of the event log registry in the state object.
 */
const defaultState = {
  items: [
    {
      id: 0,
      level: 0,
      timestamp: Date.now() - 1000 * 60 * 7 - 3,
      content: 'Information log entry #1.'
    },
    {
      id: 1,
      level: 0,
      timestamp: Date.now() - 1000 * 60 * 7 - 2,
      content: 'Information log entry #2.'
    },
    {
      id: 2,
      level: 0,
      timestamp: Date.now() - 1000 * 60 * 7 - 1,
      content: 'Information log entry #3.'
    },
    {
      id: 3,
      level: 2,
      timestamp: Date.now() - 1000 * 60 * 5,
      content: 'Something went wrong somewhere.'
    },
    {
      id: 4,
      level: 1,
      timestamp: Date.now(),
      content: 'This is just a test message.'
    }
  ],
  nextId: 5
}

/**
 * The reducer function that handles actions related to the handling of
 * the event log.
 */
const reducer = handleActions({
  ADD_LOG_ITEM: (state, action) => {
    const newItem = Object.assign({}, action.payload, {
      id: state.nextId,
      timestamp: Date.now()
    })
    return Object.assign({}, state, {
      items: [...state.items, newItem],
      nextId: state.nextId + 1
    })
  },

  DELETE_LOG_ITEM: (state, action) => {
    const deletedItemId = action.payload

    return Object.assign({}, state, {
      items: state.items.filter(i => i.id !== deletedItemId)
    })
  },

  CLEAR_LOG_ITEMS: (state, action) => {
    return Object.assign({}, state, { items: [] })
  }
}, defaultState)

export default reducer
