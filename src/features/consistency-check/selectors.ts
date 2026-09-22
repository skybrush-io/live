import { createSelector } from '@reduxjs/toolkit';

import type { AppSelector, RootState } from '~/store/reducers';
import { selectOrdered } from '~/utils/collections';

import type { ConsistencyCheckParameterNameItem } from './slice';

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
