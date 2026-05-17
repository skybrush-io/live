import type { AppSelector } from '~/store/reducers';

export const areAlertsMuted: AppSelector<boolean> = (state) =>
  state.alert.muted;

export const hasPendingAlerts: AppSelector<boolean> = (state) =>
  state.alert.count > 0;

export const hasPendingAudibleAlerts: AppSelector<boolean> = (state) =>
  !state.alert.muted && state.alert.count > 0;
