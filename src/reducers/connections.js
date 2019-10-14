/**
 * @file Reducer function for handling the part of the state object that
 * stores the state of connections. The connection list includes the
 * master connection (to the Flockwave server) and any other connection
 * that the Flockwave server reports via CONN-LIST and CONN-INF messages.
 */

import has from 'lodash/has';
import { handleActions } from 'redux-actions';

import { ConnectionState } from '~/model/connections';

/**
 * Default content of the connection registry in the state object.
 */
const defaultState = {
  // ById is a map from connection ID to the state of the connection
  byId: {},
  // Order defines the preferred ordering of connections on the UI
  order: []
};

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
function updateStateOfConnection(state, id, properties) {
  const { byId } = state;

  if (!has(byId, id)) {
    byId[id] = {
      id,
      name: id,
      state: ConnectionState.DISCONNECTED
    };
    state.order.push(id);
  }

  Object.assign(byId[id], properties);
}

/**
 * The reducer function that handles actions related to the handling of
 * connection states.
 */
const reducer = handleActions(
  {
    CLEAR_CONNECTION_LIST: () => ({
      byId: {},
      order: []
    }),

    SET_CONNECTION_STATE: (state, action) => {
      const newState = Object.assign({}, state);
      const { id } = action.payload;
      updateStateOfConnection(newState, id, action.payload);
      return newState;
    },

    SET_CONNECTION_STATE_MULTIPLE: (state, action) => {
      const newState = Object.assign({}, state);
      for (const id of Object.keys(action.payload)) {
        updateStateOfConnection(newState, id, action.payload[id]);
      }

      return newState;
    }
  },
  defaultState
);

export default reducer;
