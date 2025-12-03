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
  setAntennaPositionFormat,
  saveCoordinateForPreset,
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
  (presetId, savedCoordinate) => async (dispatch, getState) => {
    try {
      // Set the saved coordinate as the current antenna position
      await messageHub.execute.setRTKAntennaPosition({
        position: savedCoordinate.positionECEF,
        accuracy: savedCoordinate.accuracy,
      });

      // Check if the component is still mounted by checking if the dialog is still open
      const currentState = getState();
      if (!currentState.rtk.dialog.coordinateRestorationDialog.open) {
        return;
      }

      dispatch(
        showNotification({
          message: `Using saved coordinate for preset ${presetId}`,
          semantics: MessageSemantics.SUCCESS,
        })
      );
    } catch (error) {
      console.warn('Failed to set saved coordinate:', error);

      // Check if the component is still mounted
      const currentState = getState();
      if (!currentState.rtk.dialog.coordinateRestorationDialog.open) {
        return;
      }

      dispatch(
        showNotification({
          message: 'Failed to use saved coordinate.',
          semantics: MessageSemantics.ERROR,
        })
      );
    }
  };

export const saveCurrentCoordinateForPreset =
  (presetId) => (dispatch, getState) => {
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
    const savedCoordinates = state.rtk.savedCoordinates[presetId] || [];
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

    dispatch(
      showNotification({
        message: `Coordinate saved for preset ${presetId}`,
        semantics: MessageSemantics.SUCCESS,
      })
    );
  };
