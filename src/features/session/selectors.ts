import type { RootState } from '~/store/reducers';

export function getNearestFeatureIdForTooltip(
  state: RootState
): string | undefined {
  return state.session?.featureIdForTooltip;
}

export function isBroadcast(state: RootState): boolean {
  return state.session?.broadcast;
}

export function isDeveloperModeEnabled(state: RootState): boolean {
  return state.session?.developerMode;
}
