/**
 * @file Slice of the state object that stores the last known states of the
 * docking stations.
 */

import { createSlice } from '@reduxjs/toolkit';

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
    order: []
  },

  reducers: {
    /**
     * Adds some dock objects given a list of dock identifiers.
     *
     * This function does nothing for docks that already exist.
     */
    addDocksByIds(state, action) {
      for (const dockId of action.payload) {
        if (state.byId[dockId] === undefined) {
          state.byId[dockId] = {
            id: dockId
          };
          state.order.push(dockId);
        }
      }
    },

    /**
     * Clears the dock list.
     */
    clearDockList(state) {
      state.byId = {};
      state.order = [];
    }
  }
});

export const { addDocksByIds, clearDockList } = actions;

export default reducer;
