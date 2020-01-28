/**
 * @file Slice of the state object that handles the state of the UAVs.
 *
 * This is periodically synchronized with the 'flock' object that gets updated
 * more frequently (at the expense of not being integrated into Redux).
 */

import { createSlice } from '@reduxjs/toolkit';

import {
  addItemSorted,
  clearOrderedCollection,
  deleteItemsByIds,
  replaceItemOrAddSorted
} from '~/utils/collections';

const { actions, reducer } = createSlice({
  name: 'uavs',

  initialState: {
    // byId is a map from UAV ID to the UAV object itself
    byId: {
      // No UAVs are added by default. Here's how an example item should
      // look like:
      // {
      //     id: "01",
      //     lastUpdated: 1580225775722,
      //     position: {
      //         lat: 47.4732476, lon: 19.0618718, amsl: undefined, agl: 0
      //     },
      //     heading: 210,
      //     errors: [],
      //     battery: {
      //         voltage: 10.4,
      //         percentage: 41
      //     }
      // }
    },
    // Order defines the preferred ordering of UAVs on the UI. CUrrently we sort
    // automatically based on IDs.
    order: []
  },

  reducers: {
    addUAVs(state, action) {
      for (const uav of Object.values(action.payload)) {
        addItemSorted(state, uav);
      }
    },

    clearUAVList(state) {
      clearOrderedCollection(state);
    },

    removeUAVs(state, action) {
      deleteItemsByIds(state, action.payload);
    },

    updateUAVs(state, action) {
      for (const uav of Object.values(action.payload)) {
        replaceItemOrAddSorted(state, uav);
      }
    }
  }
});

export const { addUAVs, clearUAVList, removeUAVs, updateUAVs } = actions;

export default reducer;
