/**
 * @file Reducer function for handling the part of the state object that
 * stores the console messages exchanged between UAVs and the operator.
 */

import { createSlice } from '@reduxjs/toolkit';

import { MessageType } from '~/model/enums';

import { addMessage } from './utils';

/**
 * The reducer function that handles actions related to message exchange
 * between UAVs and the operator.
 */
const { actions, reducer } = createSlice({
  name: 'messages',

  initialState: {
    // Stores the messages received and sent and any additional entries to
    // show in chat histories, indexed by some arbitrary IDs (say, numbers)
    byId: {},
    // Command history for recalling earlier messages in the input box
    commandHistory: [],
    // Message IDs sorted by UAV IDs
    uavIdsToMessageIds: {
      // Keys should be UAV IDs here. The corresponding values should be
      // arrays of message IDs.
    },
    // Stores the next message ID that will be used
    nextMessageId: 1,
  },

  reducers: {
    addErrorMessage(state, action) {
      const { message, uavId, refs } = action.payload;

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

      action.messageId = messageId;
    },

    addInboundMessage(state, action) {
      const { uavId, message, refs, severity } = action.payload;

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

      action.messageId = messageId;
    },

    addOutboundMessage(state, action) {
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
          responseId: null,
          recipient: uavId,
          body: message,
          percentage: undefined,
          status: undefined,
          suspended: false,
        },
        uavId
      );

      action.messageId = messageId;

      if (state.commandHistory.at(-1) !== message) {
        state.commandHistory.push(message);
      }
    },

    clearMessagesOfUAVById(state, action) {
      const { payload: uavId } = action;
      const messageIdsForUAV = state.uavIdsToMessageIds[uavId] || [];

      for (const messageId of messageIdsForUAV) {
        delete state.byId[messageId];
      }

      delete state.uavIdsToMessageIds[uavId];
    },

    updateProgressByMessageId(state, action) {
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
