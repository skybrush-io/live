/**
 * @file Slice of the state object that stores the last known states of the
 * docking stations.
 */

import has from 'lodash-es/has';
import { createSlice } from '@reduxjs/toolkit';

import { notifyObjectsDeletedOnServer } from '~/features/objects/actions';
import {
  clearOrderedCollection,
  maybeDeleteItemsByIds,
} from '~/utils/collections';

/**
 * Function that updates the state of a dock with the given ID in
 * a state object.
 *
 * @param  {Object} state  the Redux state object to modify
 * @param  {string} id     the identifier of the connection to update
 * @param  {Object} properties  the new properties of the dock
 */
function updateStateOfDock(state, id, properties) {
  const { byId } = state;

  if (!has(byId, id)) {
    byId[id] = {
      id,
      position: null,
    };
    state.order.push(id);
  }

  Object.assign(byId[id], properties);
}

const { actions, reducer } = createSlice({
  name: 'docks',

  initialState: {
    byId: {
      // No items are added by default. Here's how an example item should
      // look like:
      // {
      //   id: 'DOCK:123456'
      // }
    },
    order: [],
  },

  reducers: {
    /**
     * Clears the dock list.
     */
    clearDockList(state) {
      clearOrderedCollection(state);
    },

    /**
     * Updates the state of a single dock, creating the dock if it does not
     * exist yet.
     */
    setDockState(state, action) {
      const { id, ...rest } = action.payload;
      updateStateOfDock(state, id, rest);
    },

    /**
     * Updates the state of multiple docks, creating the docks that do not
     * exist yet.
     */
    setDockStateMultiple(state, action) {
      const { payload } = action;
      for (const id of Object.keys(payload)) {
        updateStateOfDock(state, id, payload[id]);
      }
    },
  },

  extraReducers: {
    [notifyObjectsDeletedOnServer]: (state, action) => {
      maybeDeleteItemsByIds(state, action.payload);
    },
  },
});

export const { clearDockList, setDockState, setDockStateMultiple } = actions;

export default reducer;
