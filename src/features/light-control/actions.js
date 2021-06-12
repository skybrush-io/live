import createColor from 'color';

import {
  getCurrentColorInLightControlPanel,
  isLightControlActive,
} from './selectors';
import { setColor, setLightControlActive } from './slice';

import { showNotification } from '~/features/snackbar/slice';
import { MessageSemantics } from '~/features/snackbar/types';
import messageHub from '~/message-hub';

/**
 * Thunk that sets the current color of the light control module, activates
 * it and sends an appropriate message to the server as a side effect.
 */
export const setColorAndActivate = (color) => (dispatch, getState) => {
  dispatch(setColor(color));
  dispatch(setLightControlActive(true));
  submitShowLightConfigurationToServer(dispatch, getState);
};

/**
 * Thunk that sets the current color of the light control module, and sends an
 * appropriate message to the server as a side effect if the module is active.
 */
export const setColorAndUpdateServerIfActive =
  (color) => (dispatch, getState) => {
    const isActive = isLightControlActive(getState());

    dispatch(setColor(color));

    if (isActive) {
      submitShowLightConfigurationToServer(dispatch, getState);
    }
  };

/**
 * Thunk that toggles whether the light control module is currently active,
 * and also sends a message to the server as a side effect when the module is
 * turned on or off.
 */
export const toggleLightControlActive = () => (dispatch, getState) => {
  const isActive = isLightControlActive(getState());
  dispatch(setLightControlActive(!isActive));
  submitShowLightConfigurationToServer(dispatch, getState);
};

async function submitShowLightConfigurationToServer(dispatch, getState) {
  const state = getState();
  const isActive = isLightControlActive(state);
  const color = getCurrentColorInLightControlPanel(state);

  try {
    await messageHub.execute.setShowLightConfiguration({
      effect: isActive ? 'solid' : 'off',
      color: createColor(color).rgb().array(),
    });
  } catch {
    dispatch(
      showNotification({
        message: 'Failed to update light configuration on the server.',
        semantics: MessageSemantics.ERROR,
      })
    );
  }
}
