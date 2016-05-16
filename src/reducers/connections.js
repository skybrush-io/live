/**
 * @file Reducer function for handling the part of the state object that
 * stores the state of connections. The connection list includes the
 * master connection (to the Flockwave server) and any other connection
 * that the Flockwave server reports via CONN-LIST and CONN-INF messages.
 */

import _ from 'lodash'
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
 * Function that updates the state of a connection with the given ID in
 * a state object. Note that the state object <em>must</em> not be the
 * "real" state object of the Redux store but a copy of it (to avoid
 * mutating the state).
 *
 * @param  {Object} state  the Redux state object to modify
 * @param  {string} id     the identifier of the connection to update
 * @param  {Object} properties  the new properties of the connection
 */
function updateStateOfConnection (state, id, properties) {
  const { items } = state

  if (!items.hasOwnProperty(id)) {
    items[id] = {
      id, name: id, state: ConnectionState.DISCONNECTED
    }
    state.order.push(id)
  }

  Object.assign(items[id], properties)
}

/**
 * The reducer function that handles actions related to the handling of
 * connection states.
 */
const reducer = handleActions({

  CLEAR_CONNECTION_LIST: (state, action) => ({
    items: _.pick(state.items, MASTER_CONNECTION_ID),
    order: [MASTER_CONNECTION_ID]
  }),

  SET_CONNECTION_STATE: (state, action) => {
    const newState = Object.assign({}, state)
    const { id } = action.payload
    updateStateOfConnection(newState, id, action.payload)
    return newState
  },

  SET_CONNECTION_STATE_MULTIPLE: (state, action) => {
    const newState = Object.assign({}, state)
    for (let id of Object.keys(action.payload)) {
      updateStateOfConnection(newState, id, action.payload[id])
    }
    return newState
  }

}, defaultState)

export default reducer
