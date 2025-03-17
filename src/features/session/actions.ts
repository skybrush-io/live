import type { AppDispatch, RootState } from '~/store/reducers';

import { setBroadcast, setDeveloperMode } from './slice';
import { isBroadcast, isDeveloperModeEnabled } from './selectors';

export const toggleBroadcast =
  () =>
  (dispatch: AppDispatch, getState: () => RootState): void => {
    const state = getState();
    dispatch(setBroadcast(!isBroadcast(state)));
  };

export const toggleDeveloperMode =
  () =>
  (dispatch: AppDispatch, getState: () => RootState): void => {
    dispatch(setDeveloperMode(!isDeveloperModeEnabled(getState())));
    if (isDeveloperModeEnabled(getState())) {
      console.log('Developer mode is enabled');
    } else {
      console.log('Developer mode is disabled');
    }
  };
