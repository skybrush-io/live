import { dismissAlerts, setMuted } from './slice';

export const acknowledgeOrToggleMuted = () => (dispatch, getState) => {
  const { alert } = getState();
  if (alert.count > 0) {
    dispatch(dismissAlerts());
  } else {
    dispatch(setMuted(!alert.muted));
  }
};
