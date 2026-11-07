import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '~/store/reducers';
import { type Identifier, selectOrdered } from '~/utils/collections';

export const shouldRebootAfterParameterUpload = (state: RootState) =>
  Boolean(state.parameters.rebootAfterUpload);

/**
 * Returns whether the current parameter manifest is empty.
 */
export function isManifestEmpty(state: RootState) {
  return state.parameters.manifest.order.length === 0;
}

/**
 * Returns whether the parameter upload setup dialog is supposed to be open.
 */
export function isParameterUploadSetupDialogOpen(state: RootState) {
  return state.parameters.dialog.open;
}

/**
 * Selector that calculates and caches the list of all the parameter names
 * and values that are on the current upload manifest, in exactly the same order
 * as they should appear on the UI.
 */
export const getParameterManifest = createSelector(
  (state: RootState) => state.parameters.manifest,
  selectOrdered
);

/**
 * Returns the UAVs that the parameter upload was explicitly restricted to, or
 * `undefined` if there is no such restriction.
 */
export const getExplicitParameterUploadTargets = (
  state: RootState
): Identifier[] | undefined => state.parameters.targets;

/**
 * Selector that returns the UAVs that the parameter upload job should target,
 * or `undefined` if the job should target all UAVs.
 *
 * Explicitly specified targets take precedence. Otherwise, if every item in
 * the manifest is UAV-specific, the job targets the UAVs of the items.
 */
export const getParameterUploadTargets = createSelector(
  getExplicitParameterUploadTargets,
  getParameterManifest,
  (explicitTargets, manifest): Identifier[] | undefined => {
    if (explicitTargets && explicitTargets.length > 0) {
      return explicitTargets;
    }

    const uavIds = manifest.flatMap(({ uavId }) =>
      uavId === undefined ? [] : [uavId]
    );
    if (uavIds.length === 0 || uavIds.length < manifest.length) {
      return undefined;
    }

    return [...new Set(uavIds)].sort();
  }
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
      .map(({ name, uavId, value }) => ({ name, uavId, value }))
      .filter(({ name }) => typeof name === 'string' && name.length > 0);
    const meta = { shouldReboot };
    return { items, meta };
  }
);
