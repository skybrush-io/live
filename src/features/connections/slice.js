/**
 * @file Slice of the state object that stores the last known states of the
 * connections of the server, not including the master connection (to the
 * Skybrush server), but including any other connection that the Skybrush
 * server reports via CONN-LIST and CONN-INF messages.
 */

import { createSlice } from '@reduxjs/toolkit';

import { ConnectionState } from '~/model/connections';
import { clearOrderedCollection } from '~/utils/collections';

const createDefaultItem = (id) => ({
  id,
  name: id,
  state: ConnectionState.DISCONNECTED,
  stateChangedAt: undefined,
});

/**
 * Function that updates the state of a connection with the given ID in
 * a state object.
 *
 * The state is updated in-place.
 *
 * @param  {Object} state  the Redux state object to update
 * @param  {string} id     the identifier of the connection to update
 * @param  {Object} properties  the new properties of the connection
 */
function updateStateOfConnection(state, id, properties) {
  const { byId, order } = state;

  byId[id] = { ...(byId[id] || createDefaultItem(id)), ...properties };
  if (!order.includes(id)) {
    order.push(id);
  }
}

const { actions, reducer } = createSlice({
  name: 'connections',

  initialState: {
    byId: {
      // No items are added by default. Here's how an example item should
      // look like:
      // {
      //   id: 'gps',
      //   name: 'GPS connection',
      //   state: 'disconnected',
      //   stateChangedAt: 1234567
      // }
    },
    order: [],
  },

  reducers: {
    /**
     * Clears the connection list.
     */
    clearConnectionList(state) {
      clearOrderedCollection(state);
    },

    /**
     * Updates the status of some connections, given a mapping from connection
     * IDs to their updated states.
     */
    updateConnections(state, action) {
      for (const id of Object.keys(action.payload)) {
        updateStateOfConnection(state, id, action.payload[id]);
      }
    },
  },
});

export const { clearConnectionList, updateConnections } = actions;

export default reducer;
