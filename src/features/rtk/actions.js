import copy from 'copy-to-clipboard';
import { showNotification } from '~/features/snackbar/actions';
import { MessageSemantics } from '~/features/snackbar/types';
import messageHub from '~/message-hub';

import {
  getFormattedAntennaPosition,
  isShowingAntennaPositionInECEF,
} from './selectors';
import { closeSurveySettingsPanel, setAntennaPositionFormat, saveCoordinateForPreset } from './slice';

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

/**
 * Sets the server-side RTK correction source to the given preset.
 */
export const setSelectedPresetAsSource = (presetId) => async (dispatch) => {
  try {
    await messageHub.execute.setRTKCorrectionsSource(presetId);
  } catch (error) {
    dispatch(
      showNotification({
        message: 'Failed to set RTK correction source.',
        semantics: MessageSemantics.ERROR,
      })
    );
    return;
  }

  dispatch(
    showNotification({
      message: `RTK correction source set to preset ${presetId}`,
      semantics: MessageSemantics.SUCCESS,
    })
  );
};

export const toggleAntennaPositionFormat = () => (dispatch, getState) => {
  dispatch(
    setAntennaPositionFormat(
      isShowingAntennaPositionInECEF(getState()) ? 'lonLat' : 'ecef'
    )
  );
};

export const useSavedCoordinateForPreset = (presetId, savedCoordinate) => async (dispatch, getState) => {
  try {
    // Set the saved coordinate as the current antenna position
    await messageHub.execute.setRTKAntennaPosition(savedCoordinate.positionECEF);

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

export const saveCurrentCoordinateForPreset = (presetId) => (dispatch, getState) => {
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

  dispatch(saveCoordinateForPreset({ presetId, coordinate: savedCoordinate }));

  dispatch(
    showNotification({
      message: `Coordinate saved for preset ${presetId}`,
      semantics: MessageSemantics.SUCCESS,
    })
  );
};
