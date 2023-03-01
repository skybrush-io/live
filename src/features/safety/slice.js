/**
 * @file Reducer function for handling the part of the state object that
 * manages the safety dialog and stores safety parameters.
 */

import { createSlice } from '@reduxjs/toolkit';

import { noPayload } from '~/utils/redux';
import { SafetyDialogTab } from './constants';

const { actions, reducer } = createSlice({
  name: 'safety',

  initialState: {
    dialog: {
      open: false,
      selectedTab: SafetyDialogTab.GEOFENCE,
    },
    settings: {
      criticalBatteryVoltage: null,
      lowBatteryVoltage: null,
      returnToHomeAltitude: null,
      returnToHomeSpeed: null,
    },
  },

  reducers: {
    /**
     * Action that will hide the safety dialog.
     */
    closeSafetyDialog: noPayload((state) => {
      state.dialog.open = false;
    }),

    /**
     * Action that will show the safety dialog.
     */
    openSafetyDialog: noPayload((state) => {
      state.dialog.open = true;
    }),

    /**
     * Action that will set the selected tab in the safety dialog.
     */
    setSafetyDialogTab(state, { payload: selectedTab }) {
      state.dialog.selectedTab = selectedTab;
    },

    /**
     * Action that will update the safety preferences of the user.
     */
    updateSafetySettings(state, { payload }) {
      Object.assign(state.settings, payload);
    },
  },
});

export const {
  closeSafetyDialog,
  openSafetyDialog,
  setSafetyDialogTab,
  updateSafetySettings,
} = actions;

export default reducer;
