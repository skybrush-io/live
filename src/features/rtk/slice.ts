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

type RTKPresetDialogState = {
  open: boolean;
  mode: 'create' | 'edit' | undefined;
  presetId: string | undefined;
  presetType: 'User' | 'Built-in' | 'Dynamic' | undefined;
};

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
      presetId: string | undefined;
      savedCoordinate: RTKSavedCoordinate | undefined;
    };
  };

  presetDialog: RTKPresetDialogState;
  presetsRefreshTrigger: number;
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

  dialog: {
    open: false,
    antennaPositionFormat: RTKAntennaPositionFormat.LON_LAT,
    surveySettingsEditorVisible: false,
    coordinateRestorationDialog: {
      open: false,
      presetId: undefined,
      savedCoordinate: undefined,
    },
  },

  presetDialog: {
    open: false,
    mode: undefined,
    presetId: undefined,
    presetType: undefined,
  },
  presetsRefreshTrigger: 0,
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
      action: PayloadAction<{
        presetId: string;
        coordinate: RTKSavedCoordinate;
      }>
    ) {
      const { presetId, coordinate } = action.payload;
      state.savedCoordinates[presetId] = coordinate;
    },

    removeSavedCoordinateForPreset(state, action: PayloadAction<string>) {
      const presetId = action.payload;
      delete state.savedCoordinates[presetId];
    },

    // Coordinate restoration dialog management
    showCoordinateRestorationDialog(
      state,
      action: PayloadAction<{
        presetId: string;
        savedCoordinate: RTKSavedCoordinate;
      }>
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
        presetId: undefined,
        savedCoordinate: undefined,
      };
    }),

    openRTKPresetDialog(
      state,
      action: PayloadAction<{
        mode: 'create' | 'edit';
        presetId?: string;
        presetType?: 'User' | 'Built-in' | 'Dynamic';
      }>
    ) {
      state.presetDialog.open = true;
      state.presetDialog.mode = action.payload.mode;
      state.presetDialog.presetId = action.payload.presetId;
      state.presetDialog.presetType = action.payload.presetType ?? 'User';
    },

    closeRTKPresetDialog: noPayload<RTKSliceState>((state) => {
      state.presetDialog.open = false;
      state.presetDialog.mode = undefined;
      state.presetDialog.presetId = undefined;
      state.presetDialog.presetType = undefined;
    }),

    refreshRTKPresets: noPayload<RTKSliceState>((state) => {
      state.presetsRefreshTrigger += 1;
    }),
  },
});

export const {
  closeRTKPresetDialog,
  closeRTKSetupDialog,
  closeSurveySettingsPanel,
  closeCoordinateRestorationDialog,
  removeSavedCoordinateForPreset,
  openRTKPresetDialog,
  refreshRTKPresets,
  resetRTKStatistics,
  saveCoordinateForPreset,
  setAntennaPositionFormat,
  showRTKSetupDialog,
  showCoordinateRestorationDialog,
  toggleSurveySettingsPanel,
  updateRTKStatistics,
} = actions;

export default reducer;
