/**
 * @file Action factories related to message handling.
 */

import { createAction } from 'redux-actions'
import { CLOSE_MESSAGES_DIALOG, SHOW_MESSAGES_DIALOG, ADD_INBOUND_MESSAGE,
         SELECT_UAV_IN_MESSAGES_DIALOG, ADD_OUTBOUND_MESSAGE_TO_SELECTED_UAV,
         CLEAR_MESSAGES_OF_SELECTED_UAV, ADD_ERROR_MESSAGE_IN_MESSAGES_DIALOG }
         from './types'

/**
 * Action factory that creates an action that will add an error message to
 * a message stream in response to a given outbound message.
 *
 * @param {string} message  the message to add
 * @param {string} uavId    the ID of the UAV whose stream should contain
 *        this error message
 * @param {?string} correlationId  the ID of the outbound message that
 *        concluded with this error, if known
 */
export const addErrorMessageInMessagesDialog = createAction(
  ADD_ERROR_MESSAGE_IN_MESSAGES_DIALOG,
  (message, uavId, correlationId) => ({ message, uavId, correlationId })
)

/**
 * Action factory that creates an action that will add an inbound message
 * in response to a given outbound message.
 *
 * @param {string} message  the message to add
 * @param {number} correlationId  the ID of the message in the Redux store
 *        that this message responds to
 */
export const addInboundMessage = createAction(ADD_INBOUND_MESSAGE,
  (message, correlationId) => ({ message, correlationId })
)

/**
 * Action factory that creates an action that adds an outbound message entry
 * to the UAV that is currently selected in the dialog.
 *
 * @param {string} message  the message to add
 */
export const addOutboundMessageToSelectedUAV = createAction(
  ADD_OUTBOUND_MESSAGE_TO_SELECTED_UAV)

/**
 * Action factory that creates an action that clears the message history
 * of the currently selected UAV.
 */
export const clearMessagesOfSelectedUAV = createAction(
  CLEAR_MESSAGES_OF_SELECTED_UAV)

/**
 * Action factory that creates an action that will hide the "Messages"
 * dialog if it is open.
 */
export const closeMessagesDialog = createAction(CLOSE_MESSAGES_DIALOG)

/**
 * Action factory that creates an action that will show the "Messages"
 * dialog if it is closed.
 */
export const showMessagesDialog = createAction(SHOW_MESSAGES_DIALOG)

/**
 * Action factory that creates an action that selects a given UAV for
 * the communication target in the "Messages" dialog.
 */
export const selectUAVInMessagesDialog =
  createAction(SELECT_UAV_IN_MESSAGES_DIALOG)
