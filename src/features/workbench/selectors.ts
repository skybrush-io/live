import { createSelector } from '@reduxjs/toolkit';

import type { AppSelector } from '~/store/reducers';

export const areWorkbenchHeadersHidden: AppSelector<boolean> = (state) =>
  state.workbench.hideHeaders;

export const isWorkbenchLayoutFixed: AppSelector<boolean> = (state) =>
  state.workbench.isFixed;

export const shouldSidebarBeShown = createSelector(
  areWorkbenchHeadersHidden,
  isWorkbenchLayoutFixed,
  (hideHeaders, isFixed) => !hideHeaders && !isFixed
);
