import { createSelector } from '@reduxjs/toolkit';

import { reorder, selectOrdered } from '~/utils/collections';

export const selectMessagesOfSelectedUAVInOrder = createSelector(
  (state) => state.messages,
  (messages) => {
    const { selectedUAVId } = messages;
    const messageIds = selectedUAVId
      ? messages.uavIdsToMessageIds[selectedUAVId] || []
      : [];
    return selectedUAVId ? selectOrdered(reorder(messages, messageIds)) : null;
  }
);
