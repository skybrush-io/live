/**
 * @file Slice of the state object that stores data related to the currently
 * selected RTK stream on the server.
 */

import isNil from 'lodash-es/isNil';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { noPayload } from '~/utils/redux';

import {
  RTKAntennaPositionFormat,
  type RTKStatistics,
  type RTKSavedCoordinate,
} from './types';

type RTKSliceState = {
  stats: RTKStatistics;

  /** Saved coordinates per RTK preset ID */
  savedCoordinates: Record<string, RTKSavedCoordinate[]>;

  currentPresetId: string | undefined;

  dialog: {
    open: boolean;
    antennaPositionFormat: RTKAntennaPositionFormat;
    surveySettingsEditorVisible: boolean;
    /** Dialog for asking user if they want to use saved coordinates */
    coordinateRestorationDialog: {
      open: boolean;
      presetId: string | undefined;
    };
  };
};

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

  savedCoordinates: {},

  currentPresetId: undefined,

  dialog: {
    open: false,
    antennaPositionFormat: RTKAntennaPositionFormat.LON_LAT,
    surveySettingsEditorVisible: false,
    coordinateRestorationDialog: {
      open: false,
      presetId: undefined,
    },
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

      state.stats.survey ??= {};

      if (!isNil(survey.accuracy)) {
        state.stats.survey.accuracy = survey.accuracy;
      }

      if (!isNil(survey.flags)) {
        state.stats.survey.flags = survey.flags;
      }
    },

    // Saved coordinates management
    saveCoordinateForPreset(
      state,
      action: PayloadAction<{
        presetId: string;
        coordinate: RTKSavedCoordinate;
      }>
    ) {
      const { presetId, coordinate } = action.payload;

      state.savedCoordinates[presetId] ||= [];

      const existing = state.savedCoordinates[presetId];

      // Check if the latest coordinate is the same as the one we are trying to save
      if (existing.length > 0) {
        const latest = existing[0];
        if (
          latest &&
          latest.positionECEF[0] === coordinate.positionECEF[0] &&
          latest.positionECEF[1] === coordinate.positionECEF[1] &&
          latest.positionECEF[2] === coordinate.positionECEF[2]
        ) {
          return;
        }
      }

      const duplicateIndex = existing.findIndex(
        (c) =>
          c.positionECEF[0] === coordinate.positionECEF[0] &&
          c.positionECEF[1] === coordinate.positionECEF[1] &&
          c.positionECEF[2] === coordinate.positionECEF[2]
      );

      if (duplicateIndex !== -1) {
        existing.splice(duplicateIndex, 1);
      }

      existing.unshift(coordinate);

      if (existing.length > 5) {
        existing.pop();
      }
    },

    setCurrentRTKPresetId(state, action: PayloadAction<string | undefined>) {
      state.currentPresetId = action.payload;
    },

    removeSavedCoordinateForPreset(state, action: PayloadAction<string>) {
      const presetId = action.payload;
      delete state.savedCoordinates[presetId];
    },

    clearAllSavedCoordinates(state) {
      state.savedCoordinates = {};
    },

    // Coordinate restoration dialog management
    showCoordinateRestorationDialog(state, action: PayloadAction<string>) {
      const presetId = action.payload;
      state.dialog.coordinateRestorationDialog = {
        open: true,
        presetId,
      };
    },

    closeCoordinateRestorationDialog: noPayload<RTKSliceState>((state) => {
      state.dialog.coordinateRestorationDialog = {
        open: false,
        presetId: undefined,
      };
    }),
  },
});

export const {
  closeRTKSetupDialog,
  closeSurveySettingsPanel,
  closeCoordinateRestorationDialog,
  clearAllSavedCoordinates,
  removeSavedCoordinateForPreset,
  resetRTKStatistics,
  saveCoordinateForPreset,
  setAntennaPositionFormat,
  setCurrentRTKPresetId,
  showRTKSetupDialog,
  showCoordinateRestorationDialog,
  toggleSurveySettingsPanel,
  updateRTKStatistics,
} = actions;

export default reducer;
