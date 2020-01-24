/**
 * @file Slice of the state object that handles the the application-specific
 * settings of the user.
 */

import { createSlice } from '@reduxjs/toolkit';

import { CoordinateFormat } from '~/model/settings';

const { actions, reducer } = createSlice({
  name: 'settings',

  // Default set of application settings. This is a two-level key-value
  // store; the first level is the setting 'categories', the second level
  // is the actual settings.
  initialState: {
    display: {
      // Display format of coordinates
      coordinateFormat: CoordinateFormat.DEGREES,
      // Whether to show the mouse coordinates on the map
      showMouseCoordinates: true,
      // Whether to show the scale on the map
      showScaleLine: true
    },

    localServer: {
      // Additional command line arguments to pass to the server
      cliArguments: '',
      // Whether a local server has to be launched upon startup
      enabled: true,
      // Search path of the server
      searchPath: []
    },

    uavs: {
      // Number of seconds after which a UAV with no status updates is
      // marked by a warning state
      warnThreshold: 3,
      // Number of seconds after which a UAV with no status updates is
      // marked as gone
      goneThreshold: 60,
      // Number of seconds after which a UAV with no status updates is
      // removed from the UAV list
      forgetThreshold: 600
    }
  },

  reducers: {
    replaceAppSettings: {
      prepare: (category, updates) => ({
        payload: { category, updates }
      }),

      reducer: (state, action) => {
        const { category, updates } = action.payload;

        if (state[category] !== undefined) {
          state[category] = updates;
        }
      }
    },

    updateAppSettings: {
      prepare: (category, updates) => ({
        payload: { category, updates }
      }),

      reducer: (state, action) => {
        const { category, updates } = action.payload;

        if (state[category] !== undefined) {
          state[category] = { ...state[category], ...updates };
        }
      }
    }
  }
});

export const { replaceAppSettings, updateAppSettings } = actions;

export default reducer;
