/**
 * @file Slice of the state object that handles the state of the UAV details
 * dialog.
 */

import { createSlice } from '@reduxjs/toolkit';

import { noPayload } from '~/utils/redux';

import { UAV_DETAILS_DIALOG_MIN_WIDTH } from './constants';

const { actions, reducer } = createSlice({
  name: 'uav-details',

  initialState: {
    open: false,
    selectedUAVId: undefined,
    selectedTab: 'preflight',
    position: { x: 0, y: 0 },
    width: UAV_DETAILS_DIALOG_MIN_WIDTH,
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

    setUAVDetailsDialogPosition(state, { payload }) {
      state.position = payload;
    },

    setUAVDetailsDialogWidth(state, { payload }) {
      state.width = payload;
    },
  },
});

export const {
  openUAVDetailsDialog,
  closeUAVDetailsDialog,
  setSelectedTabInUAVDetailsDialog,
  setUAVDetailsDialogPosition,
  setUAVDetailsDialogWidth,
} = actions;

export const isUAVDetailsDialogOpen = (state) => state.dialogs.uavDetails.open;

export const getSelectedUAVIdInUAVDetailsDialog = (state) =>
  state.dialogs.uavDetails.selectedUAVId;

export const getSelectedTabInUAVDetailsDialog = (state) =>
  state.dialogs.uavDetails.selectedTab;

export const getUAVDetailsDialogPosition = (state) =>
  state.dialogs.uavDetails.position;

export const getUAVDetailsDialogWidth = (state) =>
  state.dialogs.uavDetails.width;

export default reducer;
