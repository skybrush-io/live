/**
 * @file Slice of the state object that stores data related to the currently
 * selected RTK stream on the server.
 */

import { createSlice } from '@reduxjs/toolkit';

import { noPayload } from '~/utils/redux';

const { actions, reducer } = createSlice({
  name: 'rtk',

  initialState: {
    stats: {
      // Carrier-to-noise ratio for satellites for which we have RTK correction data.
      // Keys are satellite identifiers; each associated value is the corresponding
      // carrier-to-noise ratio and the timestamp. Each associated value looks
      // like this:
      //
      // {
      //   lastUpdatedAt:UNIX timestamp in milliseconds when this message was
      //       observed the last time
      //   cnr: carrier-to-noise ratio
      // }
      satellites: {},

      // RTCM messages recently processed by the server and their bandwidth requirement.
      // Keys are RTCM message identifiers; each associated value looks like this:
      //
      // {
      //   lastUpdatedAt: UNIX timestamp in milliseconds when this message was
      //       observed the last time
      //   bitsPerSecond: number of bytes per second that this RTCM message used
      //       from the total bandwidth
      // }
      messages: {},

      // Information about the antenna position and description
      antenna: {
        descriptor: null,
        height: null,
        position: null, // should be [lon, lat]
        serialNumber: null,
        stationId: null,
      },
    },

    dialog: {
      open: false,
    },
  },

  reducers: {
    closeRTKSetupDialog: noPayload((state) => {
      state.dialog.open = false;
    }),

    showRTKSetupDialog: noPayload((state) => {
      state.dialog.open = true;
    }),

    resetRTKStatistics(state) {
      state.stats.antenna = {};
      state.stats.satellites = {};
      state.stats.messages = {};
    },

    updateRTKStatistics(state, action) {
      const { antenna, messages, cnr } = action.payload;

      state.stats.antenna = antenna;
      state.stats.messages = messages;

      if (state.stats.satellites === undefined) {
        state.stats.satellites = {};
      }

      for (const [key, value] of Object.entries(cnr)) {
        state.stats.satellites[key] = value;
      }
    },
  },
});

export const {
  closeRTKSetupDialog,
  resetRTKStatistics,
  showRTKSetupDialog,
  updateRTKStatistics,
} = actions;

export default reducer;
