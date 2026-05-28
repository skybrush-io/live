import type { AppSelector } from '~/store/reducers';

export const detachedPanels: AppSelector<string[]> = (state) =>
  state.detachablePanels.detachedPanels;

export const isDetached: AppSelector<boolean, [string]> = (state, name) =>
  state.detachablePanels.detachedPanels.includes(name);
