import copy from 'copy-to-clipboard';
import { showError, showNotification } from '~/features/snackbar/actions';
import messageHub from '~/message-hub';

import {
  getFormattedAntennaPosition,
  isShowingAntennaPositionInECEF,
} from './selectors';
import { closeSurveySettingsPanel, setAntennaPositionFormat } from './slice';

export const copyAntennaPositionToClipboard = () => (_dispatch, getState) => {
  copy(getFormattedAntennaPosition(getState()));
  showNotification('Coordinates copied to clipboard.');
};

export const startNewSurveyOnServer = (settings) => async (dispatch) => {
  try {
    await messageHub.execute.startRTKSurvey(settings);
  } catch {
    showError('Failed to start RTK survey on the server.');
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
