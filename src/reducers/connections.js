/**
 * @file Reducer function for handling the part of the state object that
 * stores the state of connections. The connection list includes the
 * master connection (to the Flockwave server) and any other connection
 * that the Flockwave server reports via CONN-LIST and CONN-INF messages.
 */

import has from 'lodash-es/has';
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

const createDefaultItem = id => ({
  id,
  name: id,
  state: ConnectionState.DISCONNECTED
});

/**
 * Function that updates the state of a connection with the given ID in
 * a state object.
 *
 * @param  {Object} state  the Redux state object to update
 * @param  {string} id     the identifier of the connection to update
 * @param  {Object} properties  the new properties of the connection
 * @return {Object} the new Redux state object
 */
function updateStateOfConnection(state, id, properties) {
  const { byId, order } = state;
  const exists = has(byId, id);
  const newItem = {
    ...(exists ? byId[id] : createDefaultItem(id)),
    ...properties
  };
  return {
    byId: {
      ...byId,
      [id]: newItem
    },
    order: exists ? order : [...order, id]
  };
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
      const { id } = action.payload;
      return updateStateOfConnection(state, id, action.payload);
    },

    SET_CONNECTION_STATE_MULTIPLE: (state, action) => {
      for (const id of Object.keys(action.payload)) {
        state = updateStateOfConnection(state, id, action.payload[id]);
      }

      return state;
    }
  },
  defaultState
);

export default reducer;
