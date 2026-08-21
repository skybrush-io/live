import { createSelector } from '@reduxjs/toolkit';

import type { HistoryItem } from '~/features/upload/types';
import { aggregatePerUAVResultsFromHistory } from '~/features/upload/utils';
import type { AppSelector, RootState } from '~/store/reducers';
import { selectOrdered } from '~/utils/collections';
import { EMPTY_ARRAY } from '~/utils/redux';

import { CONSISTENCY_CHECK_JOB_TYPE } from './constants';
import type { ConsistencyCheckParameterNameItem } from './slice';
import {
  calculateMajorityAndInconsistencies,
  calculateParameterAndErrorMaps,
} from './utils';

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
> = (state: RootState) => selectConsistencyCheckHistory(state).at(-1);

/**
 * Selector that returns the results of consistency check jobs,
 * aggregated from the job's history.
 */
export const selectConsistencyCheckResults = createSelector(
  selectConsistencyCheckHistory,
  (historyItems) => {
    const perUAVResults = aggregatePerUAVResultsFromHistory(historyItems);
    const { parameterMap, errors } =
      calculateParameterAndErrorMaps(perUAVResults);
    return {
      parameterMap,
      errors,
      ...calculateMajorityAndInconsistencies(parameterMap),
    };
  }
);

/**
 * Returns whether the consistency-check setup dialog is supposed to be open.
 */
export function isConsistencyCheckSetupDialogOpen(state: RootState) {
  return state.consistencyCheck.dialog.open;
}

/**
 * Selector that calculates and caches the list of parameter names that are
 * currently on the consistency-check list, in exactly the same order as they
 * should appear on the UI.
 */
export const getConsistencyCheckNameList: AppSelector<
  ConsistencyCheckParameterNameItem[]
> = createSelector(
  (state: RootState) => state.consistencyCheck.parameterNames,
  selectOrdered
);

/**
 * Returns whether the consistency-check parameter name list is empty.
 */
export function isConsistencyCheckNameListEmpty(state: RootState) {
  return state.consistencyCheck.parameterNames.order.length === 0;
}

/**
 * Selector that calculates the payload of the consistency-check job, given the
 * current list of parameter names.
 */
export const getConsistencyCheckJobPayload = createSelector(
  getConsistencyCheckNameList,
  (items) =>
    items
      .map((item) => item.name)
      .filter((name) => typeof name === 'string' && name.length > 0)
);
