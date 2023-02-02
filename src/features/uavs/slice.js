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
  replaceItemOrAddSorted,
  ensureNaturalSortOrder,
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
      //     gpsFix: ['3D', 17],
      //     heading: 210,
      //     errors: [],
      //     battery: {
      //         voltage: 10.4,
      //         percentage: 41,
      //         charging: true
      //     },
      //     localPosition: [1, 2, 3],
      //     age: "active"   /* one of 'active', 'inactive', 'gone' */
      // }
    },
    // Order defines the preferred ordering of UAVs on the UI. CUrrently we sort
    // automatically based on IDs.
    order: [],

    panel: {
      followMapSelection: true,
      selectedTab: 'preflight',
      selectedUAVId: undefined,
    },
  },

  reducers: {
    addUAVs(state, action) {
      for (const uav of Object.values(action.payload)) {
        addItemSorted(state, uav);
      }

      ensureNaturalSortOrder(state);
    },

    clearUAVList(state) {
      clearOrderedCollection(state);
    },

    _removeUAVsByIds(state, action) {
      // Do not call this reducer directly from anywhere except in reaction to
      // events dispatched from the global flock object. This is to ensure that
      // there is only a single source of truth for the list of UAVs; calling
      // this reducer directly would result in some UAVs being present in the
      // flock but not here
      deleteItemsByIds(state, action.payload);
    },

    setSelectedTabInUAVDetailsPanel(state, { payload }) {
      state.panel.selectedTab = payload;
    },

    setSelectedUAVIdInUAVDetailsPanel(state, { payload }) {
      state.panel.selectedUAVId = payload;
    },

    toggleFollowMapSelectionInUAVDetailsPanel: {
      prepare: () => ({}),
      reducer(state) {
        state.panel.followMapSelection = !state.panel.followMapSelection;
      },
    },

    updateAgesOfUAVs(state, action) {
      for (const [uavId, age] of Object.entries(action.payload)) {
        const uav = uavId ? state.byId[uavId] : undefined;
        if (uav) {
          uav.age = age;
        }
      }
    },

    updateUAVs(state, action) {
      for (const uav of Object.values(action.payload)) {
        replaceItemOrAddSorted(state, uav);
      }
    },
  },
});

export const {
  addUAVs,
  clearUAVList,
  setSelectedTabInUAVDetailsPanel,
  setSelectedUAVIdInUAVDetailsPanel,
  toggleFollowMapSelectionInUAVDetailsPanel,
  updateAgesOfUAVs,
  updateUAVs,
  _removeUAVsByIds,
} = actions;

export default reducer;
