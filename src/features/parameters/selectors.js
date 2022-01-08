import { createSelector } from '@reduxjs/toolkit';

import { selectOrdered } from '~/utils/collections';

/**
 * Returns whether the current parameter manifest is empty.
 */
export function isManifestEmpty(state) {
  return state.parameters.manifest.order.length === 0;
}

/**
 * Returns whether the parameter upload setup dialog is supposed to be open.
 */
export function isParameterUploadSetupDialogOpen(state) {
  return state.parameters.dialog.open;
}

/**
 * Selector that calculates and caches the list of all the parameter names
 * and values that are on the current upload manifest, in exactly the same order
 * as they should appear on the UI.
 */
export const getParameterManifest = createSelector(
  (state) => state.parameters.manifest,
  selectOrdered
);
