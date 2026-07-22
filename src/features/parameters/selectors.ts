import { createSelector } from '@reduxjs/toolkit';

import type { HistoryItem } from '~/features/upload/types';
import { aggregatePerUAVResultsFromHistory } from '~/features/upload/utils';
import type { AppSelector, RootState } from '~/store/reducers';
import { selectOrdered } from '~/utils/collections';
import { EMPTY_ARRAY } from '~/utils/redux';

import { CONSISTENCY_CHECK_JOB_TYPE } from './constants';
import { calculateParameterAndErrorMaps } from './utils';

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

/**
 * Selector that returns the history items for `CONSISTENCY_CHECK_JOB_TYPE`.
 */
const selectConsistencyCheckHistory: AppSelector<
  Array<HistoryItem<Record<string, unknown>>>
> = (state: RootState) =>
  (state.upload.history[CONSISTENCY_CHECK_JOB_TYPE] as Array<
    HistoryItem<Record<string, unknown>>
  >) ?? EMPTY_ARRAY;

/**
 * Selector that returns the latest history item for `CONSISTENCY_CHECK_JOB_TYPE`,
 * or `undefined` if the job's history is empty.
 */
export const selectLatestConsistencyCheckHistoryItem: AppSelector<
  HistoryItem<Record<string, unknown>> | undefined
> = createSelector(selectConsistencyCheckHistory, (historyItems) =>
  historyItems.length > 0 ? historyItems[historyItems.length - 1] : undefined
);

/**
 * Selector that returns the results of consistency check jobs,
 * aggregated from the job's history.
 */
export const selectConsistencyCheckResults = createSelector(
  selectConsistencyCheckHistory,
  (historyItems) => {
    const perUAVResults = aggregatePerUAVResultsFromHistory(historyItems);
    return calculateParameterAndErrorMaps(perUAVResults);
  }
);
