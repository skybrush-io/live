/**
 * @file Reducer function for handling the part of the state object that
 * stores the console messages exchanged between UAVs and the operator.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import { MessageType, type Severity } from '~/model/enums';
import type UAV from '~/model/uav';

import { type Message } from './types';
import { addMessage } from './utils';

export type MessagesSliceState = ReadonlyDeep<{
  /**
   * Stores the messages received and sent and any additional entries to
   * show in chat histories
   */
  byId: Record<Message['id'], Message>;

  /** Command history for recalling earlier messages in the input box */
  commandHistory: string[];

  /** Message IDs sorted by UAV IDs */
  uavIdsToMessageIds: Record<UAV['id'], Array<Message['id']>>;

  /** Stores the next message ID that will be used */
  nextMessageId: number;
}>;

const initialState: MessagesSliceState = {
  byId: {},
  commandHistory: [],
  uavIdsToMessageIds: {},
  nextMessageId: 1,
};

/**
 * The reducer function that handles actions related to message exchange
 * between UAVs and the operator.
 */
const { actions, reducer } = createSlice({
  name: 'messages',
  initialState,
  reducers: {
    addErrorMessage(
      state,
      action: PayloadAction<{ message: string; refs?: number; uavId: string }>
    ) {
      const { message, refs, uavId } = action.payload;

      const messageId = addMessage(
        state,
        {
          type: MessageType.ERROR,
          date: Date.now(),
          body: message,
        },
        uavId,
        refs
      );

      (action as Record<string, unknown>)['messageId'] = messageId;
    },

    addInboundMessage(
      state,
      action: PayloadAction<{
        message: string;
        refs?: number;
        severity?: Severity;
        uavId: string;
      }>
    ) {
      const { message, refs, severity, uavId } = action.payload;

      const messageId = addMessage(
        state,
        {
          type: MessageType.INBOUND,
          author: uavId,
          date: Date.now(),
          raw: true,
          recipient: 'Operator',
          severity,
          body: message,
        },
        uavId,
        refs
      );

      (action as Record<string, unknown>)['messageId'] = messageId;
    },

    addOutboundMessage(
      state,
      action: PayloadAction<{ message: string; uavId?: string }>
    ) {
      const { message, uavId } = action.payload;
      if (!uavId) {
        console.warn('Cannot send message to null recipient');
        return undefined;
      }

      const messageId = addMessage(
        state,
        {
          type: MessageType.OUTBOUND,
          author: 'Operator',
          date: Date.now(),
          responseId: undefined,
          recipient: uavId,
          body: message,
          percentage: undefined,
          status: undefined,
          suspended: false,
        },
        uavId
      );

      (action as Record<string, unknown>)['messageId'] = messageId;

      if (state.commandHistory.at(-1) !== message) {
        state.commandHistory.push(message);
      }
    },

    clearMessagesOfUAVById(state, action: PayloadAction<string>) {
      const { payload: uavId } = action;
      const messageIdsForUAV = state.uavIdsToMessageIds[uavId] ?? [];

      for (const messageId of messageIdsForUAV) {
        delete state.byId[messageId];
      }

      delete state.uavIdsToMessageIds[uavId];
    },

    updateProgressByMessageId(
      state,
      action: PayloadAction<{
        messageId: Message['id'];
        progress?: { message?: string; percentage?: number };
        suspended?: boolean;
      }>
    ) {
      const { messageId, progress, suspended } = action.payload;
      const messageState = state.byId[messageId];
      if (messageState && typeof progress === 'object') {
        if (typeof progress.percentage === 'number') {
          messageState.percentage = Number(
            Math.max(0, Math.min(progress.percentage, 100)).toFixed(1)
          );
        }

        if (progress.message !== undefined) {
          messageState.message = String(progress.message);
        }

        if (suspended !== undefined) {
          messageState.suspended = Boolean(suspended);
        }
      }
    },
  },
});

export const {
  addInboundMessage,
  addOutboundMessage,
  addErrorMessage,
  clearMessagesOfUAVById,
  updateProgressByMessageId,
} = actions;

export default reducer;
