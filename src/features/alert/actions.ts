import type { AppThunk } from '~/store/reducers';

import { dismissAlerts, setMuted } from './slice';

export const acknowledgeOrToggleMuted =
  (): AppThunk => (dispatch, getState) => {
    const { alert } = getState();
    if (alert.count > 0) {
      dispatch(dismissAlerts());
    } else {
      dispatch(setMuted(!alert.muted));
    }
  };
