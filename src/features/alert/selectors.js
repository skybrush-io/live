export const areAlertsMuted = (state) => state.alert.muted;

export const hasPendingAlerts = (state) => state.alert.count > 0;

export const hasPendingAudibleAlerts = (state) =>
  !state.alert.muted && state.alert.count > 0;
