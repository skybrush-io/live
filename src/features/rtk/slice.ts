/**
 * @file Slice of the state object that stores data related to the currently
 * selected RTK stream on the server.
 */

import isNil from 'lodash-es/isNil';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { noPayload } from '~/utils/redux';

import { RTKAntennaPositionFormat, type RTKStatistics, type RTKSavedCoordinate } from './types';

type RTKSliceState = {
  stats: RTKStatistics;

  /** Saved coordinates per RTK preset ID */
  savedCoordinates: Record<string, RTKSavedCoordinate>;

  dialog: {
    open: boolean;
    antennaPositionFormat: RTKAntennaPositionFormat;
    surveySettingsEditorVisible: boolean;
    /** Dialog for asking user if they want to use saved coordinates */
    coordinateRestorationDialog: {
      open: boolean;
      presetId: string | null;
      savedCoordinate: RTKSavedCoordinate | null;
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

  savedCoordinates: {
    // TODO: Fake data for testing - remove in production
    // '-dev-cu.usbmodem101-0': {
    //   position: [19.0402, 47.4979] as any, // Budapest coordinates
    //   positionECEF: [4080855000, 1408354000, 4679340000] as [number, number, number], // Approximate ECEF for Budapest
    //   accuracy: 0.02,
    //   savedAt: Date.now() - 86400000, // 1 day ago
    // },
    // '-dev-cu.usbmodem101-1': {
    //   position: [21.6254, 47.5289] as any, // Debrecen coordinates
    //   positionECEF: [4010557000, 1590103000, 4681871000] as [number, number, number], // Approximate ECEF for Debrecen
    //   accuracy: 0.015,
    //   savedAt: Date.now() - 172800000, // 2 days ago
    // },
  },

  dialog: {
    open: false,
    antennaPositionFormat: RTKAntennaPositionFormat.LON_LAT,
    surveySettingsEditorVisible: false,
    coordinateRestorationDialog: {
      open: false,
      presetId: null,
      savedCoordinate: null,
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

    // Saved coordinates management
    saveCoordinateForPreset(
      state,
      action: PayloadAction<{ presetId: string; coordinate: RTKSavedCoordinate }>
    ) {
      const { presetId, coordinate } = action.payload;
      state.savedCoordinates[presetId] = coordinate;
    },

    removeSavedCoordinateForPreset(
      state,
      action: PayloadAction<string>
    ) {
      const presetId = action.payload;
      delete state.savedCoordinates[presetId];
    },

    // Coordinate restoration dialog management
    showCoordinateRestorationDialog(
      state,
      action: PayloadAction<{ presetId: string; savedCoordinate: RTKSavedCoordinate }>
    ) {
      const { presetId, savedCoordinate } = action.payload;
      state.dialog.coordinateRestorationDialog = {
        open: true,
        presetId,
        savedCoordinate,
      };
    },

    closeCoordinateRestorationDialog: noPayload<RTKSliceState>((state) => {
      state.dialog.coordinateRestorationDialog = {
        open: false,
        presetId: null,
        savedCoordinate: null,
      };
    }),
  },
});

export const {
  closeRTKSetupDialog,
  closeSurveySettingsPanel,
  closeCoordinateRestorationDialog,
  removeSavedCoordinateForPreset,
  resetRTKStatistics,
  saveCoordinateForPreset,
  setAntennaPositionFormat,
  showRTKSetupDialog,
  showCoordinateRestorationDialog,
  toggleSurveySettingsPanel,
  updateRTKStatistics,
} = actions;

export default reducer;
