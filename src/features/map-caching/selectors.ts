import type { AppSelector } from '~/store/reducers';

export const isMapCachingEnabled: AppSelector<boolean> = (state) =>
  state.mapCaching.enabled;
