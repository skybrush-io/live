import { createSelector } from '@reduxjs/toolkit';

export const areWorkbenchHeadersHidden = (state) =>
  Boolean(state.workbench.hideHeaders);

export const isWorkbenchLayoutFixed = (state) =>
  Boolean(state.workbench.isFixed);

export const shouldSidebarBeShown = createSelector(
  areWorkbenchHeadersHidden,
  isWorkbenchLayoutFixed,
  (hideHeaders, isFixed) => !hideHeaders && !isFixed
);
