import copy from 'copy-to-clipboard';
import { showNotification } from '~/features/snackbar/slice';
import { MessageSemantics } from '~/features/snackbar/types';
import messageHub from '~/message-hub';

import {
  getFormattedAntennaPosition,
  isShowingAntennaPositionInECEF,
} from './selectors';
import { closeSurveySettingsPanel, setAntennaPositionFormat } from './slice';

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
