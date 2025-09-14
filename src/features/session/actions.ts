import { showNotification } from '~/features/snackbar/ToastNotificationManager';
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
      dispatch(showNotification('Developer mode is enabled') as any);
    } else {
      dispatch(showNotification('Developer mode is disabled') as any);
    }
  };
