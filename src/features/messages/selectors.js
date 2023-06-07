import { createSelector } from '@reduxjs/toolkit';

import { reorder, selectOrdered } from '~/utils/collections';
import { EMPTY_ARRAY } from '~/utils/redux';

export function createMessageListSelector() {
  return createSelector(
    (state) => state.messages,
    (state, uavId) =>
      state.messages.uavIdsToMessageIds
        ? state.messages.uavIdsToMessageIds[uavId]
        : undefined,
    (messages, messageIds) =>
      !messageIds || messageIds.length === 0
        ? EMPTY_ARRAY
        : selectOrdered(reorder(messages, messageIds))
  );
}

export const getCommandHistory = (state) => state.messages.commandHistory;
