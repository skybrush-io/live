/**
 * @file Slice of the state object that stores the last known states of the
 * connections of the server, not including the master connection (to the
 * Skybrush server), but including any other connection that the Skybrush
 * server reports via CONN-LIST and CONN-INF messages.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import {
  clearOrderedCollection,
  type Collection,
  deleteItemsByIds,
  EMPTY_COLLECTION,
} from '~/utils/collections';

import { type ConnectionProperties } from './types';
import { updateStateOfConnection } from './utils';

export type ConnectionsSliceState = ReadonlyDeep<
  Collection<ConnectionProperties>
>;

const initialState: ConnectionsSliceState = EMPTY_COLLECTION;

const { actions, reducer } = createSlice({
  name: 'connections',
  initialState,
  reducers: {
    /**
     * Clears the connection list.
     */
    clearConnectionList(state) {
      clearOrderedCollection<ConnectionProperties>(state);
    },

    /**
     * Removes one or more connections by IDs from the connection list.
     */
    removeConnectionsByIds(
      state,
      action: PayloadAction<Array<ConnectionProperties['id']>>
    ) {
      deleteItemsByIds(state, action.payload);
    },

    /**
     * Updates the status of some connections, given a mapping from connection
     * IDs to their updated states.
     */
    updateConnections(
      state,
      action: PayloadAction<
        Record<ConnectionProperties['id'], Omit<ConnectionProperties, 'id'>>
      >
    ) {
      for (const [id, connection] of Object.entries(action.payload)) {
        updateStateOfConnection(state, id, connection);
      }
    },
  },
});

export const {
  clearConnectionList,
  removeConnectionsByIds,
  updateConnections,
} = actions;

export default reducer;
