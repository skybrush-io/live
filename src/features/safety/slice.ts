/**
 * @file Reducer function for handling the part of the state object that
 * manages the safety dialog and stores geofence and safety parameters.
 */

import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { noPayload } from '~/utils/redux';

import { SafetyDialogTab } from './constants';
import { GeofenceGenerationMethod, type BatteryThreshold } from './model';

export type SafetySliceState = {
  dialog: {
    open: boolean;
    selectedTab: SafetyDialogTab;
  };
  // TODO: Move geofence action here from the `mission` slice.
  geofence: {
    horizontalMargin: number;
    verticalMargin: number;
    generationMethod: GeofenceGenerationMethod;
    simplify: boolean;
    maxVertexCount: number;
  };
  settings: {
    criticalBatteryVoltage?: number;
    lowBatteryThreshold?: BatteryThreshold;
    returnToHomeAltitude?: number;
    returnToHomeSpeed?: number;
  };
};

export const initialState: SafetySliceState = {
  dialog: {
    open: false,
    selectedTab: SafetyDialogTab.GEOFENCE,
  },
  geofence: {
    horizontalMargin: 20,
    verticalMargin: 10,
    generationMethod: GeofenceGenerationMethod.CONVEX,
    simplify: true,
    maxVertexCount: 10,
  },
  settings: {
    criticalBatteryVoltage: undefined,
    lowBatteryThreshold: undefined,
    returnToHomeAltitude: undefined,
    returnToHomeSpeed: undefined,
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
