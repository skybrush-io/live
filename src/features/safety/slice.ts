/**
 * @file Reducer function for handling the part of the state object that
 * manages the safety dialog and stores geofence and safety parameters.
 */

import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import { noPayload } from '~/utils/redux';
import { type Nullable } from '~/utils/types';

import { SafetyDialogTab } from './constants';

export type SafetySliceState = ReadonlyDeep<{
  dialog: {
    open: boolean;
    selectedTab: SafetyDialogTab;
  };
  geofence: {
    horizontalMargin: number;
    verticalMargin: number;
    simplify: boolean;
    maxVertexCount: number;
  };
  settings: {
    criticalBatteryVoltage: Nullable<number>;
    lowBatteryVoltage: Nullable<number>;
    returnToHomeAltitude: Nullable<number>;
    returnToHomeSpeed: Nullable<number>;
  };
}>;

const initialState: SafetySliceState = {
  dialog: {
    open: false,
    selectedTab: SafetyDialogTab.GEOFENCE,
  },
  geofence: {
    horizontalMargin: 20,
    verticalMargin: 10,
    simplify: true,
    maxVertexCount: 10,
  },
  settings: {
    criticalBatteryVoltage: null,
    lowBatteryVoltage: null,
    returnToHomeAltitude: null,
    returnToHomeSpeed: null,
  },
};

const { actions, reducer } = createSlice({
  name: 'safety',
  initialState,
  reducers: {
    /**
     * Action that will hide the safety dialog.
     */
    closeSafetyDialog: noPayload<SafetySliceState>((state) => {
      state.dialog.open = false;
    }),

    /**
     * Action that will show the safety dialog.
     */
    openSafetyDialog: noPayload<SafetySliceState>((state) => {
      state.dialog.open = true;
    }),

    /**
     * Action that will set the selected tab in the safety dialog.
     */
    setSafetyDialogTab(
      state,
      { payload: selectedTab }: PayloadAction<SafetyDialogTab>
    ) {
      state.dialog.selectedTab = selectedTab;
    },

    /**
     * Action that will update the geofence preferences of the user.
     */
    updateGeofenceSettings(
      state,
      { payload }: PayloadAction<SafetySliceState['geofence']>
    ) {
      Object.assign(state.geofence, payload);
    },

    /**
     * Action that will update the safety preferences of the user.
     */
    updateSafetySettings(
      state,
      { payload }: PayloadAction<SafetySliceState['settings']>
    ) {
      Object.assign(state.settings, payload);
    },
  },
});

export const {
  closeSafetyDialog,
  openSafetyDialog,
  setSafetyDialogTab,
  updateGeofenceSettings,
  updateSafetySettings,
} = actions;

export default reducer;
