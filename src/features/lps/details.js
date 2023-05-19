/**
 * @file Slice of the state object that handles the state of the UAV details
 * dialog.
 */

import { createSlice } from '@reduxjs/toolkit';

import { noPayload } from '~/utils/redux';

const { actions, reducer } = createSlice({
  name: 'lps-details',

  initialState: {
    open: false,
    selectedLPSId: undefined,
    selectedTab: 'anchors',
  },

  reducers: {
    openLPSDetailsDialog(state, { payload }) {
      state.selectedLPSId = payload;
      state.open = true;
    },

    closeLPSDetailsDialog: noPayload((state) => {
      state.open = false;
    }),

    setSelectedTabInLPSDetailsDialog(state, { payload }) {
      state.selectedTab = payload;
    },
  },
});

export const {
  openLPSDetailsDialog,
  closeLPSDetailsDialog,
  setSelectedTabInLPSDetailsDialog,
} = actions;

export const isLPSDetailsDialogOpen = (state) => state.dialogs.lpsDetails.open;

export const getSelectedLPSIdInLPSDetailsDialog = (state) =>
  state.dialogs.lpsDetails.selectedLPSId;

export const getSelectedTabInLPSDetailsDialog = (state) =>
  state.dialogs.lpsDetails.selectedTab;

export default reducer;
