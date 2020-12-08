/**
 * @file Slice of the state object that handles the state of the UAV details
 * dialog.
 */

import { createSlice } from '@reduxjs/toolkit';

import { noPayload } from '~/utils/redux';

const { actions, reducer } = createSlice({
  name: 'uav-details',

  initialState: {
    open: false,
    selectedUAVId: undefined,
    selectedTab: 'status',
  },

  reducers: {
    openUAVDetailsDialog(state, { payload }) {
      state.selectedUAVId = payload;
      state.open = true;
    },

    closeUAVDetailsDialog: noPayload((state) => {
      state.open = false;
    }),

    setSelectedTabInUAVDetailsDialog(state, { payload }) {
      state.selectedTab = payload;
    },
  },
});

export const {
  openUAVDetailsDialog,
  closeUAVDetailsDialog,
  setSelectedTabInUAVDetailsDialog,
} = actions;

export default reducer;
