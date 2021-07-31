/**
 * @file Slice of the state object that handles the state of the dock details
 * dialog.
 */

import { createSlice } from '@reduxjs/toolkit';

import { noPayload } from '~/utils/redux';

const { actions, reducer } = createSlice({
  name: 'dock-details',

  initialState: {
    open: false,
    selectedDockId: undefined,
    selectedTab: 'status',
  },

  reducers: {
    openDockDetailsDialog(state, { payload }) {
      state.selectedDockId = payload;
      state.open = true;
    },

    closeDockDetailsDialog: noPayload((state) => {
      state.open = false;
    }),

    setSelectedTabInDockDetailsDialog(state, { payload }) {
      state.selectedTab = payload;
    },
  },
});

export const {
  openDockDetailsDialog,
  closeDockDetailsDialog,
  setSelectedTabInDockDetailsDialog,
} = actions;

export const getSelectedDockIdInDockDetailsDialog = (state) =>
  state.dialogs.dockDetails.selectedDockId;

export const getSelectedTabInDockDetailsDialog = (state) =>
  state.dialogs.dockDetails.selectedTab;

export default reducer;
