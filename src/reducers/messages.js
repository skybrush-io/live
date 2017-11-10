/**
 * @file Reducer function for handling the part of the state object that
 * stores the console messages exchanged between UAVs and the operator.
 */

import { handleActions } from 'redux-actions'
import u from 'updeep'

import { extendWith } from '../utils/operators'
import { MessageType } from '../model/messages'

/**
 * Default content of the message history in the state object.
 */
const defaultState = {
  // Stores the messages received and sent and any additional entries to
  // show in chat histories, indexed by some arbitrary IDs (say, numbers)
  byId: {
  },
  // Message IDs sorted by UAV IDs
  uavIdsToMessageIds: {
    // Keys should be UAV IDs here. The corresponding values should be
    // arrays of message IDs.
  },
  // Stores the next message ID that will be used
  nextMessageId: 0,
  // Stores the ID of the UAV to target with the SEND_MESSAGE_TO_SELECTED_UAV action
  selectedUAVId: null
}

/**
 * Returns the message IDs currently associated to the given UAV.
 *
 * @param {Object} state  the Redux store
 * @param {string} uavId  the ID of the UAV
 * @return {string[]} the IDs of the messages associated to the given UAV,
 *         or an empty array if there is no such UAV
 */
const getMessageIdsForUAV = (state, uavId) => (
  state.uavIdsToMessageIds[uavId] || []
)

/**
 * Helper function that generates a "next" message ID given the current
 * message ID.
 *
 * @param {number} messageId  the current message ID
 * @return {number} the next message ID
 */
const generateNextMessageId = messageId => messageId + 1

/**
 * Updates the given state object by adding a new error message in the
 * message stream of a drone.
 *
 * The state object passed into the function will not be mutated; an
 * appropriately constructed new state object will be returned instead.
 *
 * @param {Object} state  the Redux store to update
 * @param {string} uavId  the ID of the drone to add the error message to
 * @param {string} body   the error message to add
 * @param {?string} correlationId  the ID of the message that this error
 *        message relates to. Removes the "in progress" state of the
 *        message if given.
 *
 * @return {Object} the new state of the Redux store
 */
function addErrorMessage (state, uavId, body, correlationId) {
  const message = {
    id: state.nextMessageId,
    type: MessageType.ERROR,
    date: new Date(),
    body
  }

  const updates = {
    byId: {
      [message.id]: () => message
    },
    uavIdsToMessageIds: {
      [uavId]: extendWith(message.id)
    },
    nextMessageId: generateNextMessageId
  }

  if (typeof correlationId !== 'undefined') {
    updates.byId[correlationId] = {
      responseId: message.id
    }
  }

  return u(updates, state)
}

/**
 * Updates the given state object by adding a new message that is assumed
 * to originate from some source drone.
 *
 * The state object passed into the function will not be mutated; an
 * appropriately constructed new state object will be returned instead.
 *
 * @param {Object} state  the Redux store to update
 * @param {string} correlationId  the ID of the original message to which
 *        this message is a response
 * @param {string} body   the body of the message that was received
 * @return {Object} the new state of the Redux store
 */
function addInboundMessage (state, correlationId, body) {
  const originalMessage = state.byId[correlationId]
  if (!originalMessage) {
    console.warn(`Stale response arrived for unknown message ${correlationId}`)
    return state
  }

  const { recipient } = originalMessage
  const response = {
    id: state.nextMessageId,
    type: MessageType.INBOUND,
    author: recipient,
    date: new Date(),
    raw: true,
    recipient: 'Operator',
    body
  }

  const updates = {
    byId: {
      [originalMessage.id]: {
        responseId: response.id
      },
      [response.id]: () => response
    },
    uavIdsToMessageIds: {
      [recipient]: extendWith(response.id)
    },
    nextMessageId: generateNextMessageId
  }

  return u(updates, state)
}

/**
 * Updates the given state object by adding a new message targeted to the
 * given recipient drone.
 *
 * The state object passed into the function will not be mutated; an
 * appropriately constructed new state object will be returned instead.
 *
 * @param {Object} state  the Redux store to update
 * @param {string} recipient  the ID of the UAV that will receive the
 *        message
 * @param {string} body   the body of the message to send
 * @return {Object} the new state of the Redux store
 */
function addOutboundMessageToUAV (state, recipient, body) {
  if (!recipient) {
    console.warn('Cannot send message to null recipient')
    return state
  }

  const message = {
    id: state.nextMessageId,
    type: MessageType.OUTBOUND,
    author: 'Operator',
    date: new Date(),
    responseId: null,
    recipient,
    body
  }

  return u({
    byId: {
      [message.id]: () => message
    },
    uavIdsToMessageIds: {
      [recipient]: extendWith(message.id)
    },
    nextMessageId: generateNextMessageId
  }, state)
}

/**
  * The reducer function that handles actions related to message exchange
  * between UAVs and the operator.
  */
const reducer = handleActions({
  ADD_ERROR_MESSAGE_IN_MESSAGES_DIALOG (state, action) {
    const { message, uavId, correlationId } = action.payload
    return addErrorMessage(state, uavId, message, correlationId)
  },

  ADD_INBOUND_MESSAGE (state, action) {
    const { message, correlationId } = action.payload
    return addInboundMessage(state, correlationId, message)
  },

  ADD_OUTBOUND_MESSAGE_TO_SELECTED_UAV (state, action) {
    action.messageId = state.nextMessageId
    action.uavId = state.selectedUAVId
    return addOutboundMessageToUAV(
      state, state.selectedUAVId, action.payload
    )
  },

  CLEAR_MESSAGES_OF_SELECTED_UAV (state, action) {
    const { selectedUAVId } = state
    const messageIdsForUAV = getMessageIdsForUAV(state, selectedUAVId)
    return u({
      byId: u.omit(messageIdsForUAV),
      uavIdsToMessageIds: u.omit(selectedUAVId)
    }, state)
  },

  SELECT_UAV_IN_MESSAGES_DIALOG: (state, action) => (
    Object.assign({}, state, { selectedUAVId: action.payload })
  )
}, defaultState)

export default reducer
