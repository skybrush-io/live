import { MessageType } from '~/model/messages';

function addMessage(state, message, peer, refs) {
  message.id = state.nextMessageId;

  if (refs !== undefined) {
    const originalMessage = state.byId[refs];
    if (originalMessage) {
      originalMessage.responseId = message.id;
    }
  }

  state.byId[message.id] = message;
  state.nextMessageId += 1;

  let idList = state.uavIdsToMessageIds[peer];
  if (!idList) {
    idList = [];
    state.uavIdsToMessageIds[peer] = idList;
  }

  idList.push(message.id);

  return message.id;
}

/**
 * Updates the given state object by adding a new message that is assumed
 * to originate from some source drone.
 *
 * The state object passed into the function will not be mutated; an
 * appropriately constructed new state object will be returned instead.
 *
 * @param {Object} state  the Redux store to update
 * @param {string} uavId  the ID of the drone to add the inbound message to
 * @param {string} body   the body of the message that was received
 * @param {string} refs  the ID of the original message to which
 *        this message is a response
 * @return {string} the ID of the newly added message
 */
export function addInboundMessageHelper(state, uavId, body, refs) {
  return addMessage(
    state,
    {
      type: MessageType.INBOUND,
      author: uavId,
      date: Date.now(),
      raw: true,
      recipient: 'Operator',
      body,
    },
    uavId,
    refs
  );
}

/**
 * Updates the given state object by adding a new message targeted to the
 * given recipient drone.
 *
 * The state object passed into the function will not be mutated; an
 * appropriately constructed new state object will be returned instead.
 *
 * @param {Object} state  the Redux store to update
 * @param {string} uavId  the ID of the UAV that will receive the message
 * @param {string} body   the body of the message to send
 * @return {string} the ID of the newly added message; undefined if no message
 *         was added to the state
 */
export function addOutboundMessageHelper(state, uavId, body) {
  if (!uavId) {
    console.warn('Cannot send message to null recipient');
    return undefined;
  }

  return addMessage(
    state,
    {
      type: MessageType.OUTBOUND,
      author: 'Operator',
      date: Date.now(),
      responseId: null,
      recipient: uavId,
      body,
    },
    uavId
  );
}

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
 * @param {?string} refs  the ID of the message that this error
 *        message relates to. Removes the "in progress" state of the
 *        message if given.
 * @return {string} the ID of the newly added message
 */
export function addErrorMessageHelper(state, uavId, body, refs) {
  return addMessage(
    state,
    {
      type: MessageType.ERROR,
      date: Date.now(),
      body,
    },
    uavId,
    refs
  );
}
