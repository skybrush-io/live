import type { AppSelector, RootState } from '~/store/reducers';

export const detachedPanels: AppSelector<string[]> = (state: RootState) =>
  state.detachablePanels.detachedPanels;

export const isDetached: AppSelector<boolean, [string]> = (
  state: RootState,
  name
) => state.detachablePanels.detachedPanels.includes(name);
