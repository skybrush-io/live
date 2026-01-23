import copy from 'copy-to-clipboard';
import { showNotification } from '~/features/snackbar/actions';
import { MessageSemantics } from '~/features/snackbar/types';
import messageHub from '~/message-hub';

import {
  getFormattedAntennaPosition,
  isShowingAntennaPositionInECEF,
} from './selectors';
import {
  closeSurveySettingsPanel,
  saveCoordinateForPreset,
  setAntennaPositionFormat,
} from './slice';

export const copyAntennaPositionToClipboard = () => (dispatch, getState) => {
  copy(getFormattedAntennaPosition(getState()));
  dispatch(showNotification('Coordinates copied to clipboard.'));
};

export const startNewSurveyOnServer = (settings) => async (dispatch) => {
  try {
    await messageHub.execute.startRTKSurvey(settings);
  } catch {
    dispatch(
      showNotification({
        message: 'Failed to start RTK survey on the server.',
        semantics: MessageSemantics.ERROR,
      })
    );
    return;
  }

  dispatch(closeSurveySettingsPanel());
};

export const toggleAntennaPositionFormat = () => (dispatch, getState) => {
  dispatch(
    setAntennaPositionFormat(
      isShowingAntennaPositionInECEF(getState()) ? 'lonLat' : 'ecef'
    )
  );
};

export const useSavedCoordinateForPreset =
  (presetId, savedCoordinate) => async (dispatch) => {
    try {
      // Set the saved coordinate as the current antenna position
      await messageHub.execute.setRTKAntennaPosition({
        position: savedCoordinate.positionECEF,
        accuracy: savedCoordinate.accuracy,
      });

      dispatch(
        showNotification({
          message: `Using saved coordinate for preset ${presetId}`,
          semantics: MessageSemantics.SUCCESS,
        })
      );
    } catch (error) {
      console.warn('Failed to set saved coordinate:', error);

      dispatch(
        showNotification({
          message: 'Failed to use saved coordinate.',
          semantics: MessageSemantics.ERROR,
        })
      );
    }
  };

export const saveCurrentCoordinateForPreset =
  (presetId) => async (dispatch, getState) => {
    const state = getState();
    const { antenna, survey } = state.rtk.stats;

    if (!antenna.position || !antenna.positionECEF || !survey.accuracy) {
      dispatch(
        showNotification({
          message: 'No valid coordinate data available to save.',
          semantics: MessageSemantics.ERROR,
        })
      );
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
        latest.positionECEF[0] === savedCoordinate.positionECEF[0] &&
        latest.positionECEF[1] === savedCoordinate.positionECEF[1] &&
        latest.positionECEF[2] === savedCoordinate.positionECEF[2]
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
      const presets = await messageHub.query.getRTKPresets();
      const preset = presets.find((p) => p.id === presetId);
      if (preset) {
        presetName = preset.title;
      }
    } catch (error) {
      console.warn('Failed to fetch RTK presets:', error);
    }

    dispatch(
      showNotification({
        message: `Coordinate saved for preset ${presetName}`,
        semantics: MessageSemantics.SUCCESS,
      })
    );
  };
