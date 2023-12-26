/**
 * @file Slice of the state object that handles the the application-specific
 * settings of the user.
 */

import config from 'config';

import { createSlice, type Draft, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import {
  DEFAULT_BATTERY_CELL_COUNT,
  LIPO_FULL_CHARGE_VOLTAGE,
  LIPO_LOW_VOLTAGE_THRESHOLD,
  LIPO_CRITICAL_VOLTAGE_THRESHOLD,
} from '~/model/constants';
import {
  AltitudeSummaryType,
  BatteryDisplayStyle,
  CoordinateFormat,
  UAVOperationConfirmationStyle,
} from '~/model/settings';
import { UAVSortKey } from '~/model/sorting';
import { isRunningOnTouch } from '~/utils/platform';
import { noPayload } from '~/utils/redux';

import { type SettingsState, Theme, UAVListLayout } from './types';

type SettingsSliceState = ReadonlyDeep<SettingsState>;

const initialState: SettingsSliceState = {
  display: {
    altitudeSummaryType: AltitudeSummaryType.AMSL,
    coordinateFormat: CoordinateFormat.SIGNED_DEGREES,
    experimentalFeaturesEnabled: false,
    hideEmptyMissionSlots: false,
    language: 'en',
    optimizeForSingleUAV: config.optimizeForSingleUAV.default,
    optimizeUIForTouch: config.optimizeUIForTouch.default ?? isRunningOnTouch,
    showMissionIds: false,
    showMouseCoordinates: true,
    showScaleLine: true,
    theme: Theme.AUTO,
    hideInactiveSegmentsOnDarkLCD: false,
    uavListFilters: [
      /* Each item in this array is currently a string from the UAVFilter
       * enum */
    ],
    uavListLayout: UAVListLayout.GRID,
    uavListSortPreference: {
      key: UAVSortKey.DEFAULT,
      reverse: false,
    },
  },

  threeD: {
    scenery: 'auto',
    lighting: 'dark',
    grid: 'none',
    quality: 'medium',
    showAxes: true,
    showHomePositions: true,
    showLandingPositions: false,
    showStatistics: false,
    showTrajectoriesOfSelection: true,
  },

  localServer: {
    cliArguments: '',
    enabled: false,
    searchPath: [],
  },

  uavs: {
    autoRemove: false,
    warnThreshold: 3,
    goneThreshold: 60,
    forgetThreshold: 600,
    placementAccuracy: 1000,
    defaultBatteryCellCount: DEFAULT_BATTERY_CELL_COUNT,
    fullChargeVoltage: LIPO_FULL_CHARGE_VOLTAGE,
    lowVoltageThreshold: LIPO_LOW_VOLTAGE_THRESHOLD,
    criticalVoltageThreshold: LIPO_CRITICAL_VOLTAGE_THRESHOLD,
    preferredBatteryDisplayStyle: BatteryDisplayStyle.VOLTAGE,
    uavOperationConfirmationStyle: UAVOperationConfirmationStyle.NEVER,
  },

  apiKeys: {},
};

const { actions, reducer } = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    replaceAppSettings: {
      prepare: <Category extends keyof SettingsSliceState>(
        category: Category,
        updates: SettingsSliceState[Category]
      ) => ({
        payload: { category, updates },
      }),

      reducer<Category extends keyof SettingsSliceState>(
        state: Draft<SettingsSliceState>,
        action: PayloadAction<{
          category: Category;
          updates: SettingsState[Category];
        }>
      ) {
        const { category, updates } = action.payload;

        if (state[category] !== undefined) {
          state[category] = updates;
        }
      },
    },

    toggleLightingConditionsInThreeDView: noPayload<SettingsSliceState>(
      (state) => {
        state.threeD.lighting =
          state.threeD.lighting === 'dark' ? 'light' : 'dark';
      }
    ),

    toggleMissionIds: noPayload<SettingsSliceState>((state) => {
      state.display.showMissionIds = !state.display.showMissionIds;
    }),

    updateAppSettings: {
      prepare: <Category extends keyof SettingsSliceState>(
        category: Category,
        updates: Partial<SettingsSliceState[Category]>
      ) => ({
        payload: { category, updates },
      }),

      reducer<Category extends keyof SettingsSliceState>(
        state: Draft<SettingsSliceState>,
        action: PayloadAction<{
          category: Category;
          updates: Partial<SettingsState[Category]>;
        }>
      ) {
        const { category, updates } = action.payload;

        if (state[category] !== undefined) {
          state[category] = { ...state[category], ...updates };
        }
      },
    },
  },
});

export const {
  replaceAppSettings,
  toggleLightingConditionsInThreeDView,
  toggleMissionIds,
  updateAppSettings,
} = actions;

export default reducer;
