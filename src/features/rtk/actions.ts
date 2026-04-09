import type {
  RTKConfigurationPreset,
  RTKSurveySettings,
} from '@skybrush/flockwave-spec';
import copy from 'copy-to-clipboard';
import isEqual from 'lodash-es/isEqual';
import { showError, showNotification } from '~/features/snackbar/actions';
import { MessageSemantics } from '~/features/snackbar/types';
import messageHub from '~/message-hub';
import type { AppThunk } from '~/store/reducers';

import {
  getFormattedAntennaPosition,
  isShowingAntennaPositionInECEF,
} from './selectors';
import {
  closeSurveySettingsPanel,
  saveCoordinateForPreset,
  setAntennaPositionFormat,
} from './slice';
import { RTKAntennaPositionFormat, type RTKSavedCoordinate } from './types';

export const copyAntennaPositionToClipboard =
  (): AppThunk => (_dispatch, getState) => {
    const position = getFormattedAntennaPosition(getState());
    if (position) {
      copy(position);
      showNotification('Coordinates copied to clipboard.');
    }
  };

export const startNewSurveyOnServer =
  (settings: RTKSurveySettings): AppThunk =>
  async (dispatch) => {
    try {
      await messageHub.execute.startRTKSurvey(settings);
    } catch {
      showError('Failed to start RTK survey on the server.');
      return;
    }

    dispatch(closeSurveySettingsPanel());
  };

export const toggleAntennaPositionFormat =
  (): AppThunk => (dispatch, getState) => {
    dispatch(
      setAntennaPositionFormat(
        isShowingAntennaPositionInECEF(getState())
          ? RTKAntennaPositionFormat.LON_LAT
          : RTKAntennaPositionFormat.ECEF
      )
    );
  };

export const useSavedCoordinateForPreset =
  (
    presetId: string | undefined,
    savedCoordinate: RTKSavedCoordinate
  ): AppThunk =>
  async () => {
    try {
      // Set the saved coordinate as the current antenna position
      await messageHub.execute.setRTKAntennaPosition({
        position: savedCoordinate.positionECEF,
        accuracy: savedCoordinate.accuracy,
      });

      showNotification({
        message: `Using saved coordinate for preset ${presetId}`,
        semantics: MessageSemantics.SUCCESS,
      });
    } catch (error) {
      console.warn('Failed to set saved coordinate:', error);

      showNotification({
        message: 'Failed to use saved coordinate.',
        semantics: MessageSemantics.ERROR,
      });
    }
  };

export const saveCurrentCoordinateForPreset =
  (presetId: string): AppThunk =>
  async (dispatch, getState) => {
    const state = getState();
    const { antenna, survey } = state.rtk.stats;

    if (!antenna.position || !antenna.positionECEF || !survey.accuracy) {
      showNotification({
        message: 'No valid coordinate data available to save.',
        semantics: MessageSemantics.ERROR,
      });
      return;
    }

    const savedCoordinate = {
      position: antenna.position,
      positionECEF: antenna.positionECEF,
      accuracy: survey.accuracy,
      savedAt: Date.now(),
    };

    // Check if this exact coordinate is already the latest saved one
    const savedCoordinates = state.rtk.savedCoordinates[presetId] ?? [];
    if (savedCoordinates.length > 0) {
      const latest = savedCoordinates[0];
      if (
        latest &&
        isEqual(latest.positionECEF, savedCoordinate.positionECEF)
      ) {
        // Coordinate is already saved as the latest, do nothing
        return;
      }
    }

    dispatch(
      saveCoordinateForPreset({ presetId, coordinate: savedCoordinate })
    );

    let presetName = presetId;
    try {
      const presets: RTKConfigurationPreset[] =
        await messageHub.query.getRTKPresets();
      const preset = presets.find((p) => p.id === presetId);
      if (preset) {
        presetName = preset.title;
      }
    } catch (error) {
      console.warn('Failed to fetch RTK presets:', error);
    }

    showNotification({
      message: `Coordinate saved for preset ${presetName}`,
      semantics: MessageSemantics.SUCCESS,
    });
  };
