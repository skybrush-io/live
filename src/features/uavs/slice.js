/**
 * @file Slice of the state object that handles the state of the UAVs.
 *
 * This is periodically synchronized with the 'flock' object that gets updated
 * more frequently (at the expense of not being integrated into Redux).
 */

import { createSlice } from '@reduxjs/toolkit';

import { clearOrderedCollection } from '~/utils/collections';

const { actions, reducer } = createSlice({
  name: 'uavs',

  initialState: {
    // byId is a map from UAV ID to the UAV object itself
    byId: {
      // No UAVs are added by default. Here's how an example item should
      // look like:
      // {
      //     id: "01",
      // }
    },
    // Order defines the preferred ordering of UAVs on the UI
    order: []
  },

  reducers: {
    clearUAVList(state) {
      clearOrderedCollection(state);
    }
  }
});

export const { clearUAVList } = actions;

export default reducer;
