/**
 * @file Reducer function for handling the part of the state object that
 * stores the state of connections. The connection list includes the
 * master connection (to the Flockwave server) and any other connection
 * that the Flockwave server reports via CONN-LIST and CONN-INF messages.
 */

import { handleActions } from 'redux-actions'
import { ConnectionState, MASTER_CONNECTION_ID } from '../connections'

/**
 * Default content of the connection registry in the state object.
 */
const defaultState = {
  // items is a map from connection ID to the state of the connection
  items: {
    [MASTER_CONNECTION_ID]: {
      id: MASTER_CONNECTION_ID,
      name: 'Flockwave server',
      state: ConnectionState.DISCONNECTED
    }
  },
  // order defines the preferred ordering of connections on the UI
  order: [MASTER_CONNECTION_ID]
}

/**
 * The reducer function that handles actions related to the handling of
 * connection states.
 */
const reducer = handleActions({

  SET_CONNECTION_STATE: (state, action) => {
    const newState = Object.assign({}, state)
    const { items, order } = newState
    const id = action.payload.id

    if (!items.hasOwnProperty(id)) {
      items[id] = {
        id, name: id, state: ConnectionState.DISCONNECTED
      }
      order.push(id)
    }

    Object.assign(items[id], action.payload)
    return newState
  }

}, defaultState)

export default reducer
