import createColor from 'color';
import isEqual from 'lodash-es/isEqual';

import { showError } from '~/features/snackbar/actions';
import messageHub from '~/message-hub';
import type { AppThunk, RootState } from '~/store/reducers';

import {
  getCurrentColorInLightControlPanel,
  isLightControlActive,
} from './selectors';
import { setColor, setLightControlActive } from './slice';

/**
 * Thunk that sets the current color of the light control module, activates
 * it and sends an appropriate message to the server as a side effect.
 */
export const setColorAndActivate =
  (color: string): AppThunk =>
  (dispatch, getState) => {
    dispatch(setColor(color));
    dispatch(setLightControlActive(true));
    void submitShowLightConfigurationToServer(getState);
  };

/**
 * Thunk that sets the current color of the light control module, and sends an
 * appropriate message to the server as a side effect if the module is active.
 */
export const setColorAndUpdateServerIfActive =
  (color: string): AppThunk =>
  (dispatch, getState) => {
    const isActive = isLightControlActive(getState());

    dispatch(setColor(color));

    if (isActive) {
      void submitShowLightConfigurationToServer(getState);
    }
  };

/**
 * Thunk that toggles whether the light control module is currently active,
 * and also sends a message to the server as a side effect when the module is
 * turned on or off.
 */
export const toggleLightControlActive =
  (): AppThunk => (dispatch, getState) => {
    const isActive = isLightControlActive(getState());
    dispatch(setLightControlActive(!isActive));
    void submitShowLightConfigurationToServer(getState);
  };

/**
 * Thunk that retrieves the current light configuration from the server and
 * updates the state of the light control module accordingly.
 *
 * The update is skipped if the state of the light control module changed
 * locally while the request was in flight; in this case the local change is
 * being sent to the server and the server will notify us again.
 */
export const updateLightControlFromServer =
  (): AppThunk => async (dispatch, getState) => {
    const isActiveBefore = isLightControlActive(getState());
    const colorBefore = getCurrentColorInLightControlPanel(getState());

    let config;
    try {
      config = await messageHub.query.getShowLightConfiguration();
    } catch (error) {
      console.warn(
        'Failed to retrieve light configuration from server:',
        error
      );
      return;
    }

    const state = getState();
    if (
      isLightControlActive(state) !== isActiveBefore ||
      getCurrentColorInLightControlPanel(state) !== colorBefore
    ) {
      return;
    }

    if (config.effect === 'solid' || config.effect === 'off') {
      const isActive = config.effect === 'solid';
      if (isActive !== isActiveBefore) {
        dispatch(setLightControlActive(isActive));
      }
    }

    if (
      Array.isArray(config.color) &&
      !isEqual(config.color, createColor(colorBefore).rgb().array())
    ) {
      dispatch(setColor(createColor.rgb(config.color).hex()));
    }
  };

async function submitShowLightConfigurationToServer(getState: () => RootState) {
  const state = getState();
  const isActive = isLightControlActive(state);
  const color = getCurrentColorInLightControlPanel(state);

  try {
    await messageHub.execute.setShowLightConfiguration({
      effect: isActive ? 'solid' : 'off',
      color: createColor(color).rgb().array() as [number, number, number],
    });
  } catch {
    showError('Failed to update light configuration on the server.');
  }
}
