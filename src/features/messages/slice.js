/**
 * @file Reducer function for handling the part of the state object that
 * stores the console messages exchanged between UAVs and the operator.
 */

import { createSlice } from '@reduxjs/toolkit';

import { noPayload } from '~/utils/redux';

import {
  addErrorMessageHelper,
  addInboundMessageHelper,
  addOutboundMessageHelper,
} from './utils';

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
    // Stores whether the Messages dialog is open
    dialogVisible: false,
  },

  reducers: {
    addErrorMessage(state, action) {
      const { message, uavId, refs } = action.payload;
      addErrorMessageHelper(state, uavId, message, refs);
    },

    addInboundMessage(state, action) {
      const { message, uavId, refs } = action.payload;
      addInboundMessageHelper(state, uavId, message, refs);
    },

    addOutboundMessage(state, action) {
      const { message, uavId } = action.payload;
      const messageId = addOutboundMessageHelper(state, uavId, message);
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

    showMessagesDialog: noPayload((state) => {
      state.dialogVisible = true;
    }),

    closeMessagesDialog: noPayload((state) => {
      state.dialogVisible = false;
    }),
  },
});

export const {
  addInboundMessage,
  addOutboundMessage,
  addErrorMessage,
  clearMessagesOfUAVById,
  closeMessagesDialog,
  showMessagesDialog,
} = actions;

export default reducer;
