import { createSelector } from '@reduxjs/toolkit';

import { selectOrdered } from '~/utils/collections';

export const shouldRebootAfterParameterUpload = (state) =>
  Boolean(state.parameters.rebootAfterUpload);

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

/**
 * Selector that calculates the payload of the parameter upload job, given the
 * current parameter manifest.
 */
export const getParameterUploadJobPayloadFromManifest = createSelector(
  getParameterManifest,
  shouldRebootAfterParameterUpload,
  (manifest, shouldReboot) => {
    const items = manifest
      .map(({ name, value }) => ({ name, value }))
      .filter(({ name }) => typeof name === 'string' && name.length > 0);
    const meta = { shouldReboot };
    return { items, meta };
  }
);
