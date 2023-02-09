/**
 * @file Slice of the state object that handles the the application-specific
 * settings of the user.
 */

import config from 'config';

import { createSlice } from '@reduxjs/toolkit';

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
} from '~/model/settings';
import { UAVSortKey } from '~/model/sorting';
import { isRunningOnTouch } from '~/utils/platform';

const { actions, reducer } = createSlice({
  name: 'settings',

  // Default set of application settings. This is a two-level key-value
  // store; the first level is the setting 'categories', the second level
  // is the actual settings.
  initialState: {
    display: {
      // Altitude summary type
      altitudeSummaryType: AltitudeSummaryType.AMSL,
      // Display format of coordinates
      coordinateFormat: CoordinateFormat.SIGNED_DEGREES,
      // Whether to allow the user to see experimental features
      experimentalFeaturesEnabled: false,
      // Whether to hide empty mission slots in the UAV list (unless editing)
      hideEmptyMissionSlots: false,
      // Whether the application should be optimized for operating a single UAV.
      optimizeForSingleUAV: config.optimizeForSingleUAV.default,
      // Whether the UI should be adjusted primarily for touchscreen experience.
      optimizeUIForTouch: config.optimizeUIForTouch.default ?? isRunningOnTouch,
      // Whether to show mission IDs or drone IDs in the UAV list
      showMissionIds: false,
      // Whether to show the mouse coordinates on the map
      showMouseCoordinates: true,
      // Whether to show the scale on the map
      showScaleLine: true,
      // Which UI theme to use (choose from OS, use light mode or use dark mode)
      theme: 'auto',
      // Whether to hide inactive segments on dark mode LCD clocks
      hideInactiveSegmentsOnDarkLCD: false,
      // Filters applied to the UAV list
      uavListFilters: [
        /* Each item in this array is currently a string from the UAVFilter
         * enum */
      ],
      // Layout of the UAV list: grid or list
      uavListLayout: 'grid',
      // Sort preference of the UAV list
      uavListSortPreference: {
        key: UAVSortKey.DEFAULT,
        reverse: false,
      },
    },

    threeD: {
      // Scenery to use in the 3D view
      scenery: 'auto',

      // Lighting conditions to use in the 3D view
      lighting: 'dark',

      // Whether to show grid lines on the ground in 3D view. Values correspond
      // to the 'grid' setting of aframe-environment-component; currently we
      // support 'none', '1x1' and '2x2'
      grid: 'none',

      // Rendering quality of the 3D view (low, medium or high)
      quality: 'medium',

      // Whether to show the coordinate system axes
      showAxes: true,

      // Whether to show the home positions of the UAVs
      showHomePositions: true,

      // Whether to show the landing positions of the UAVs
      showLandingPositions: false,

      // Whether to show statistics about the rendering in an overlay
      showStatistics: false,

      // Whether to show the planned trajectories of the selected UAVs
      showTrajectoriesOfSelection: true,
    },

    localServer: {
      // Additional command line arguments to pass to the server
      cliArguments: '',
      // Whether a local server has to be launched upon startup. This is
      // disabled until we have a reliable and tested way to launch the
      // server on all platforms.
      enabled: false,
      // Search path of the server
      searchPath: [],
    },

    uavs: {
      // Stores whether UAVs that have not been seen for a long while should
      // be forgotten automatically. We start with safe settings so this is
      // set to false by default
      autoRemove: false,
      // Number of seconds after which a UAV with no status updates is
      // marked by a warning state
      warnThreshold: 3,
      // Number of seconds after which a UAV with no status updates is
      // marked as gone
      goneThreshold: 60,
      // Number of seconds after which a UAV with no status updates is
      // removed from the UAV list
      forgetThreshold: 600,
      // Desired placement accuracy in preflight checks, in millimeters,
      // as an integer, to avoid rounding errors
      placementAccuracy: 1000,
      // Battery-related properties
      // Default battery cell count that the GCS assumes for drones that do not
      // provide battery percentage estimates
      defaultBatteryCellCount: DEFAULT_BATTERY_CELL_COUNT,
      // Voltage of a fully charged battery cell, in volts
      fullChargeVoltage: LIPO_FULL_CHARGE_VOLTAGE,
      // Low battery warning threshold (per cell), in volts
      lowVoltageThreshold: LIPO_LOW_VOLTAGE_THRESHOLD,
      // Critical battery warning threshold (per cell), in volts
      criticalVoltageThreshold: LIPO_CRITICAL_VOLTAGE_THRESHOLD,
      // Whether to prefer percentages or voltages when showing the battery status
      preferredBatteryDisplayStyle: BatteryDisplayStyle.VOLTAGE,
    },

    apiKeys: {},
  },

  reducers: {
    replaceAppSettings: {
      prepare: (category, updates) => ({
        payload: { category, updates },
      }),

      reducer(state, action) {
        const { category, updates } = action.payload;

        if (state[category] !== undefined) {
          state[category] = updates;
        }
      },
    },

    toggleLightingConditionsInThreeDView: {
      prepare: () => ({}), // this is to swallow event arguments
      reducer(state) {
        state.threeD.lighting =
          state.threeD.lighting === 'dark' ? 'light' : 'dark';
      },
    },

    toggleMissionIds: {
      prepare: () => ({}), // this is to swallow event arguments
      reducer(state) {
        state.display.showMissionIds = !state.display.showMissionIds;
      },
    },

    updateAppSettings: {
      prepare: (category, updates) => ({
        payload: { category, updates },
      }),

      reducer(state, action) {
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
