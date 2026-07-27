import { createSelector } from '@reduxjs/toolkit';

import type { HistoryItem } from '~/features/upload/types';
import { aggregatePerUAVResultsFromHistory } from '~/features/upload/utils';
import type { AppSelector, RootState } from '~/store/reducers';
import { EMPTY_ARRAY } from '~/utils/redux';

import { CONSISTENCY_CHECK_JOB_TYPE } from './constants';
import { calculateParameterAndErrorMaps } from './utils';

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
