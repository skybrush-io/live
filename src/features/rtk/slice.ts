/**
 * @file Slice of the state object that stores data related to the currently
 * selected RTK stream on the server.
 */

import isNil from 'lodash-es/isNil';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import { noPayload } from '~/utils/redux';

import { RTKAntennaPositionFormat, type RTKStatistics } from './types';

type RTKSliceState = ReadonlyDeep<{
  stats: RTKStatistics;

  dialog: {
    open: boolean;
    antennaPositionFormat: RTKAntennaPositionFormat;
    surveySettingsEditorVisible: boolean;
  };
}>;

const initialState: RTKSliceState = {
  stats: {
    lastUpdatedAt: undefined,
    satellites: {},
    messages: {},
    antenna: {
      descriptor: undefined,
      height: undefined,
      position: undefined,
      positionECEF: undefined,
      serialNumber: undefined,
      stationId: undefined,
    },
    survey: {
      accuracy: undefined,
      flags: 0,
    },
  },

  dialog: {
    open: false,
    antennaPositionFormat: RTKAntennaPositionFormat.LON_LAT,
    surveySettingsEditorVisible: false,
  },
};

const { actions, reducer } = createSlice({
  name: 'rtk',
  initialState,
  reducers: {
    closeRTKSetupDialog: noPayload<RTKSliceState>((state) => {
      state.dialog.open = false;
    }),

    closeSurveySettingsPanel: noPayload<RTKSliceState>((state) => {
      state.dialog.surveySettingsEditorVisible = false;
    }),

    showRTKSetupDialog: noPayload<RTKSliceState>((state) => {
      state.dialog.open = true;
    }),

    resetRTKStatistics(state) {
      state.stats.lastUpdatedAt = undefined;
      state.stats.antenna = {};
      state.stats.satellites = {};
      state.stats.messages = {};
      state.stats.survey = {};
    },

    setAntennaPositionFormat(
      state,
      action: PayloadAction<RTKAntennaPositionFormat>
    ) {
      state.dialog.antennaPositionFormat = action.payload;
    },

    toggleSurveySettingsPanel: noPayload<RTKSliceState>((state) => {
      state.dialog.surveySettingsEditorVisible =
        !state.dialog.surveySettingsEditorVisible;
    }),

    updateRTKStatistics(state, action: PayloadAction<RTKStatistics>) {
      const { antenna, lastUpdatedAt, messages, satellites, survey } =
        action.payload;

      state.stats.antenna = antenna;
      state.stats.lastUpdatedAt = lastUpdatedAt;
      state.stats.messages = messages;

      // Here we assume that a full CNR status update was sent by the server so
      // if we don't see a satellite there, then it means that the satellite is
      // gone
      state.stats.satellites = satellites;

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
  setAntennaPositionFormat,
  showRTKSetupDialog,
  toggleSurveySettingsPanel,
  updateRTKStatistics,
} = actions;

export default reducer;
