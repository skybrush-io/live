import { createSelector } from '@reduxjs/toolkit';

import type { HistoryItem } from '~/features/upload/types';
import { aggregatePerUAVResultsFromHistory } from '~/features/upload/utils';
import type { RootState } from '~/store/reducers';

import { analyzeValueConsistency } from './analysis';
import type { ValueConsistencyResult } from './types';

/**
 * Value-consistency result for an empty job history.
 */
const EMPTY_VALUE_CONSISTENCY_RESULT: ValueConsistencyResult = Object.freeze({
  distribution: Object.freeze({}),
  errors: Object.freeze({}),
  majority: Object.freeze({}),
  inconsistencies: Object.freeze({}),
});

/**
 * Returns the latest history item for the given job type, or `undefined`
 * if that job's history is empty.
 */
export const selectLatestHistoryItem = (
  state: RootState,
  jobType: string
): HistoryItem | undefined => state.upload.history[jobType]?.at(-1);

/**
 * Returns the value-consistency result for the given job type, aggregated
 * from that job's history.
 */
export const selectValueConsistencyResults = createSelector(
  (state: RootState, jobType: string) =>
    state.upload.history[jobType] as
      Array<HistoryItem<Record<string, unknown>>> | undefined,
  (historyItems): ValueConsistencyResult =>
    historyItems === undefined
      ? EMPTY_VALUE_CONSISTENCY_RESULT
      : analyzeValueConsistency(aggregatePerUAVResultsFromHistory(historyItems))
);
