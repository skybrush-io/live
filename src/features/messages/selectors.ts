import { createSelector } from '@reduxjs/toolkit';

import { reorder, selectOrdered, type Identifier } from '~/utils/collections';
import { EMPTY_ARRAY } from '~/utils/redux';

import type { AppSelector, RootState } from '~/store/reducers';

export function createMessageListSelector() {
  return createSelector(
    (state: RootState) => state.messages,
    (state: RootState, uavId: Identifier) =>
      state.messages.uavIdsToMessageIds
        ? state.messages.uavIdsToMessageIds[uavId]
        : undefined,
    (messages, messageIds) =>
      !messageIds || messageIds.length === 0
        ? EMPTY_ARRAY
        : selectOrdered(reorder(messages, messageIds))
  );
}

export const getCommandHistory: AppSelector<string[]> = (state) =>
  state.messages.commandHistory;
