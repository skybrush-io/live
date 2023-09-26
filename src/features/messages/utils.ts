import { type Draft } from '@reduxjs/toolkit';

import { type MessagesSliceState } from './slice';
import { type Message } from './types';

export function addMessage(
  state: Draft<MessagesSliceState>,
  messageStub: Omit<Message, 'id'>,
  peer: string,
  refs?: number
): Message['id'] {
  const message: Message = { id: state.nextMessageId++, ...messageStub };

  if (refs !== undefined) {
    const originalMessage = state.byId[refs];
    if (originalMessage) {
      originalMessage.responseId = message.id;
    }
  }

  state.byId[message.id] = message;

  let idList = state.uavIdsToMessageIds[peer];
  if (!idList) {
    idList = [];
    state.uavIdsToMessageIds[peer] = idList;
  }

  idList.push(message.id);

  return message.id;
}
