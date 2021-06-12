/**
 * @file Slice of the state object that stores data related to the currently
 * selected RTK stream on the server.
 */

import isNil from 'lodash-es/isNil';
import { createSlice } from '@reduxjs/toolkit';

import { noPayload } from '~/utils/redux';

const { actions, reducer } = createSlice({
  name: 'rtk',

  initialState: {
    stats: {
      // Timestamp when the statistics was updated the last time, as a UNIX
      // timestamp
      lastUpdatedAt: null,

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

      // Information about the status of the survey process
      survey: {
        // Achieved surveying accuracy, in meters
        accuracy: null,
        // Status flags; bit 0 = survey available, bit 1 = survey in progress,
        // bit 2 = surveyed coordinate valid
        flags: 0,
      },
    },

    dialog: {
      open: false,
      surveySettingsEditorVisible: false,
    },
  },

  reducers: {
    closeRTKSetupDialog: noPayload((state) => {
      state.dialog.open = false;
    }),

    closeSurveySettingsPanel: noPayload((state) => {
      state.dialog.surveySettingsEditorVisible = false;
    }),

    showRTKSetupDialog: noPayload((state) => {
      state.dialog.open = true;
    }),

    resetRTKStatistics(state) {
      state.stats.lastUpdatedAt = null;
      state.stats.antenna = {};
      state.stats.satellites = {};
      state.stats.messages = {};
      state.stats.survey = {};
    },

    toggleSurveySettingsPanel: noPayload((state) => {
      state.dialog.surveySettingsEditorVisible =
        !state.dialog.surveySettingsEditorVisible;
    }),

    updateRTKStatistics(state, action) {
      const { antenna, lastUpdatedAt, messages, cnr, survey } = action.payload;

      state.stats.antenna = antenna;
      state.stats.lastUpdatedAt = lastUpdatedAt;
      state.stats.messages = messages;

      // Here we assume that a full CNR status update was sent by the server so
      // if we don't see a satellite there, then it means that the satellite is
      // gone
      state.stats.satellites = cnr;

      if (state.stats.survey === undefined) {
        state.stats.survey = {};
      }

      if (!isNil(survey.accuracy)) {
        state.stats.survey.accuracy = survey.accuracy;
      }

      if (!isNil(survey.flags)) {
        state.stats.survey.flags = survey.flags;
      }
    },
  },
});

export const {
  closeRTKSetupDialog,
  closeSurveySettingsPanel,
  resetRTKStatistics,
  showRTKSetupDialog,
  toggleSurveySettingsPanel,
  updateRTKStatistics,
} = actions;

export default reducer;
