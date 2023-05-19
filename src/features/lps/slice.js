/**
 * @file Slice of the state object that stores the last known states of the
 * local positioning systems known to the server.
 */

import has from 'lodash-es/has';
import { createSlice } from '@reduxjs/toolkit';

import { notifyObjectsDeletedOnServer } from '~/features/objects/actions';
import {
  clearOrderedCollection,
  maybeDeleteItemsByIds,
} from '~/utils/collections';

/**
 * Function that updates the state of a local positioning system with the given
 * ID in a state object.
 *
 * @param  {Object} state  the Redux state object to modify
 * @param  {string} id     the identifier of the local positioning system to update
 * @param  {Object} properties  the new properties of the local positioning system
 */
function updateStateOfLocalPositioningSystem(state, id, properties) {
  const { byId } = state;

  if (!has(byId, id)) {
    byId[id] = {
      id,
    };
    state.order.push(id);
  }

  Object.assign(byId[id], properties);
}

const { actions, reducer } = createSlice({
  name: 'lps',

  initialState: {
    byId: {
      // No items are added by default. Here's how an example item should
      // look like:
      // {
      //   id: 'LPS:foo',
      //   name: 'LPS named foo',
      //   type: 'foo',
      //   errors: [1, 2, 3],
      //   anchors: [
      //     {
      //       "position": [1, 2, 3],
      //       "battery": 50,
      //     }, ...
      //   ],
      //   ...
      // }
    },
    order: [],
  },

  reducers: {
    /**
     * Clears the list of local positioning systems.
     */
    clearLocalPositioningSystemList(state) {
      clearOrderedCollection(state);
    },

    /**
     * Updates the state of a single local positioning system, creating it if
     * it does not exist yet.
     */
    setLocalPositioningSystemState(state, action) {
      const { id, ...rest } = action.payload;
      updateStateOfLocalPositioningSystem(state, id, rest);
    },

    /**
     * Updates the state of multiple local positioning systems, creating the
     * ones that do not exist yet.
     */
    setLocalPositioningSystemStateMultiple(state, action) {
      const { payload } = action;
      for (const id of Object.keys(payload)) {
        updateStateOfLocalPositioningSystem(state, id, payload[id]);
      }
    },
  },

  extraReducers: {
    [notifyObjectsDeletedOnServer](state, action) {
      maybeDeleteItemsByIds(state, action.payload);
    },
  },
});

export const {
  clearLocalPositioningSystemList,
  setLocalPositioningSystemState,
  setLocalPositioningSystemStateMultiple,
} = actions;

export default reducer;
