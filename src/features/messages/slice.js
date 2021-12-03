/**
 * @file Reducer function for handling the part of the state object that
 * stores the console messages exchanged between UAVs and the operator.
 */

import { createSlice } from '@reduxjs/toolkit';

import { MessageType, Severity } from '~/model/enums';
import { noPayload } from '~/utils/redux';

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
        },
        uavId
      );

      action.messageId = messageId;
    },

    clearMessagesOfUAVById(state, action) {
      const { payload: uavId } = action;
      const messageIdsForUAV = state.uavIdsToMessageIds[uavId] || [];

      for (const messageId of messageIdsForUAV) {
        delete state.byId[messageId];
      }

      delete state.uavIdsToMessageIds[uavId];
    },
  },
});

export const {
  addInboundMessage,
  addOutboundMessage,
  addErrorMessage,
  clearMessagesOfUAVById,
} = actions;

export default reducer;
