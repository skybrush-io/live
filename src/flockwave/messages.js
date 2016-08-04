/**
 * @file Functions and classes related to dealing with Flockwave messages.
 */

import isObject from 'lodash/isObject'
import MersenneTwister from 'mersenne-twister'
import radix64 from 'radix-64'

import { createCommandRequest, createMessageWithType } from './builders'
import { extractReceiptFromCommandRequest } from './parsing'
import version from './version'

/**
 * Radix-64 encoder for generating Flockwave message IDs.
 */
const radix64Encoder = radix64()

/**
 * Private Mersenne Twister random number generator for message IDs.
 */
const rng = new MersenneTwister()

/**
 * Creates a new Flockwave message ID.
 *
 * @return {string} a new, random Flockwave message ID
 */
const createMessageId = () => (
  radix64Encoder.encodeInt(rng.random_int() & 0x3fffffff) +
  radix64Encoder.encodeInt(rng.random_int() & 0x3fffffff, 5)
)

/**
 * Creates a new Flockwave message with the given body.
 *
 * @param {Object} body  the body of the message to send, or the type of
 *        the message to send (in which case an appropriate body with
 *        only the given type is created)
 * @return {Object}  the Flockwave message with the given body
 */
function createMessage (body = {}) {
  if (!isObject(body)) {
    body = createMessageWithType(body)
  }
  return {
    '$fw.version': version,
    'id': createMessageId(),
    'body': body
  }
}

/**
 * Error class thrown by promises when the emitter object of the message
 * hub changes while waiting for a response from the server.
 */
class EmitterChangedError extends Error {
  constructor (message) {
    super(message || 'Message hub emitter changed while waiting for a response')
  }
}

/**
 * Error class thrown when the user attempts to send a message without an
 * emitter being associated to the hub.
 */
class NoEmitterError extends Error {
  constructor (message) {
    super(message || 'No emitter was associated to the message hub')
  }
}

/**
 * Error class thrown when the Flockwave server failed to respond to a
 * message in time. This class is exported in MessageHub as
 * <code>MessageHub.Timeout</code>.
 */
export class Timeout extends Error {
  constructor (messageId) {
    super(`Response to message ${messageId} timed out`)
    this.messageId = messageId
  }
}

/**
 * Error class thrown when the Flockwave server failed to respond to a
 * command execution request in time, or when it responded with a
 * CMD-TIMEOUT message. This class is exported in MessageHub as
 * <code>MessageHub.CommandExecutionTimeout</code>.
 */
export class CommandExecutionTimeout extends Error {
  constructor (receipt) {
    super(`Response to command ${receipt} timed out`)
    this.receipt = receipt
    this.userMessage = 'Response timed out'
  }
}

/**
 * Lightweight class that stores the information necessary to resolve or
 * fail the promise that we return when the user sends a message via the
 * message hub.
 */
class PendingResponse {
  /**
   * Constructor.
   *
   * @param {string} messageId  the identifier of the Flockwave message
   *        to which this pending response belongs
   * @param {function} resolve  the resolver function of a promise to
   *        call when the response has arrived
   * @param {function} reject   the rejector function of a promise to
   *        call when the response has not arrived in time or we failed
   *        to resolve the promise for any other reason
   */
  constructor (messageId, resolve, reject) {
    this._messageId = messageId
    this._promiseResolver = resolve
    this._promiseRejector = reject
  }

  /**
   * The ID of the message associated to this pending response.
   */
  get messageId () {
    return this._messageId
  }

  /**
   * Function to call when the response to the message has arrived.
   *
   * @param  {Object} result the response to the message
   */
  resolve (result) {
    this._clearTimeoutIfNeeded()
    this._promiseResolver(result)
  }

  /**
   * Function to call when we are explicitly rejecting the promise for the
   * response, even if the response has not timed out yet.
   *
   * @param {Error} error  the error to reject the promise with
   */
  reject (error) {
    this._clearTimeoutIfNeeded()
    this._promiseRejector(error)
  }

  /**
   * Function to call when the response to the message has timed out.
   */
  timeout () {
    this._promiseRejector(new Timeout(this.messageId))
  }

  /**
   * Clears the timeout associated to the pending response if needed.
   */
  _clearTimeoutIfNeeded () {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = undefined
    }
  }
}

/**
 * Lightweight class that stores the information necessary to resolve or
 * fail the promise that we return when the user sends a command request
 * (CMD-REQ) via the message hub and we are waiting for the corresponding
 * CMD-RESP or CMD-TIMEOUT message.
 */
class PendingCommandExecution {
  /**
   * Constructor.
   *
   * @param {string} receipt  the receipt of the command execution that we
   *        are waiting for
   * @param {function} resolve  the resolver function of a promise to
   *        call when the response has arrived
   * @param {function} reject   the rejector function of a promise to
   *        call when the response has not arrived in time or we failed
   *        to resolve the promise for any other reason
   */
  constructor (receipt, resolve, reject) {
    this._receipt = receipt
    this._promiseResolver = resolve
    this._promiseRejector = reject
  }

  /**
   * The receipt associated to this pending command execution.
   */
  get receipt () {
    return this._receipt
  }

  /**
   * Function to call when the response to the request has timed out on the
   * client side, i.e. the client decided that it does not wait for the
   * response from the server any more.
   */
  clientSideTimeout () {
    this._promiseRejector(new CommandExecutionTimeout(this.receipt))
  }

  /**
   * Function to call when the response to the command execution request has
   * arrived.
   *
   * @param  {Object} result the response to the command execution request
   */
  resolve (result) {
    this._clearTimeoutIfNeeded()
    this._promiseResolver(result)
  }

  /**
   * Function to call when we are explicitly rejecting the promise for the
   * response, even if the response has not timed out yet.
   *
   * @param {Error} error  the error to reject the promise with
   */
  reject (error) {
    this._clearTimeoutIfNeeded()
    this._promiseRejector(error)
  }

  /**
   * Function to call when the response to the request has timed out on the
   * server side, i.e. the server has signalled that it is not waiting for
   * the execution of the command on the UAV any more.
   */
  serverSideTimeout () {
    this.reject(new CommandExecutionTimeout(this.receipt))
  }

  /**
   * Clears the timeout associated to the pending response if needed.
   */
  _clearTimeoutIfNeeded () {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = undefined
    }
  }
}

/**
 * Manager class that keeps track of command execution requests that were
 * sent to the server and watches the incoming CMD-RESP and CMD-TIMEOUT
 * messages so it gets notified whenever a pending command execution has
 * finished or timed out.
 */
class CommandExecutionManager {
  /**
   * Constructor. Creates a new manager that will attach to the given
   * message hub to inspect the incoming CMD-RESP and CMD-TIMEOUT messages.
   *
   * @param {MessageHub} hub  the message hub that the manager will attach to
   */
  constructor (hub) {
    this._hub = undefined
    this._pendingCommandExecutions = {}

    this._onResponseReceived = this._onResponseReceived.bind(this)
    this._onTimeoutReceived = this._onTimeoutReceived.bind(this)

    this._attachToHub(hub)
  }

  /**
   * Returns the message hub that the execution manager is attached to.
   */
  get hub () {
    return this._hub
  }

  /**
   * Sets the message hub that the execution manager is attached to.
   *
   * This function may be called only once during the lifetime of the
   * manager. Once the manager is attached to a hub, there is currently no
   * way to detach it.
   *
   * @param {MessageHub} value  the new message hub to attach to
   */
  _attachToHub (value) {
    if (value === this._hub) {
      return
    }

    if (this._hub) {
      throw new Error('You may not detach a PendingCommandExecutionManager' +
        'from its message hub')
    }

    this._hub = value

    if (this._hub) {
      // Register our own notification handlers
      this._hub.registerNotificationHandlers({
        'CMD-RESP': this._onResponseReceived,
        'CMD-TIMEOUT': this._onTimeoutReceived
      })
    }
  }

  /**
   * Cancels all pending command executions by rejecting the corresponding
   * promises with the given error.
   *
   * @param {Error} error  the error to reject the promises with
   */
  cancelAll (error) {
    const pendingCommandExecutions = this._pendingCommandExecutions
    for (let receipt of Object.keys(pendingCommandExecutions)) {
      const pendingExecution = pendingCommandExecutions[receipt]
      if (pendingExecution) {
        pendingExecution.reject(error)
      }
    }
    this._pendingCommandExecutions = {}
  }

  /**
   * Sends a Flockwave command request (CMD-REQ) with the given body and
   * positional and keyword arguments and returns a promise that resolves
   * when one of the following events happen:
   *
   * <ul>
   * <li>The server signals an execution failure in a direct CMD-REQ
   * response to the original request. In this case, the promise errors
   * out with an appropriate human-readable message.</li>
   * <li>The server returns the response to the request in a CMD-RESP
   * message. In this case, the promise resolves normally with the
   * CMD-RESP message itself.</li>
   * <li>The server signals a timeout for the request in a CMD-TIMEOUT
   * message. In this case, the promise errors out with an appropriate
   * human-readable message.</li>
   * </ul>
   *
   * @param  {string}    uavId   ID of the UAV to send the request to
   * @param  {string}    command the command to send to a UAV
   * @param  {Object[]}  args    array of positional arguments to pass along
   *         with the command. May be undefined.
   * @param  {Object}    kwds    mapping of keyword argument names to their
   *         values; these are also passed with the command. May be
   *         undefined.
   * @return {Promise} a promise that resolves to the response of the UAV
   *         to the command or errors out in case of execution errors and
   *         timeouts.
   */
  sendCommandRequest (uavId, command, args, kwds) {
    const request = createCommandRequest([uavId], command, args, kwds)
    const hub = this.hub
    return new Promise((resolve, reject) => {
      hub.sendMessage(request).then(
        response => {
          const receipt = extractReceiptFromCommandRequest(response, uavId)
          const pendingCommandExecution = new PendingCommandExecution(
            receipt, resolve, reject)
          this._pendingCommandExecutions[receipt] = pendingCommandExecution

          // TODO: add client-side timeout; see sendMessage() below for an
          // example
        }
      ).catch(reject)
    })
  }

  /**
   * Handler called when the server returns a response for a command
   * execution request in the form of a CMD-RESP notification.
   *
   * @param {string} message  the message sent by the server
   */
  _onResponseReceived (message) {
    const { id } = message.body
    const pendingCommandExecution = this._pendingCommandExecutions[id]
    if (pendingCommandExecution) {
      delete this._pendingCommandExecutions[id]
      pendingCommandExecution.resolve(message)
    } else {
      console.warn(`Stale command response received for receipt=${id}`)
    }
  }

  /**
   * Handler called when the server signals a timeout for a command
   * execution request in the form of a CMD-TIMEOUT notification.
   *
   * @param {string} message  the message sent by the server
   */
  _onTimeoutReceived (message) {
    const { ids } = message.body
    for (let id of ids) {
      const pendingCommandExecution = this._pendingCommandExecutions[id]
      if (pendingCommandExecution) {
        delete this._pendingCommandExecutions[id]
        pendingCommandExecution.serverSideTimeout()
      } else {
        console.warn(`Stale command timeout received for receipt=${id}`)
      }
    }
  }
}

/**
 * Message hub class that can be used to send Flockwave messages and get
 * promises that will resolve when the server responds to them.
 */
export default class MessageHub {
  /**
   * Constructor.
   *
   * @param {function} emitter  a function to call when the hub wants to
   *        emit a new message
   * @param {number}   timeout  number of seconds to wait for a response for
   *        a message from the server before we consider it as a timeout
   */
  constructor (emitter, timeout = 5) {
    this.emitter = emitter
    this.timeout = timeout

    this._notificationHandlers = {}
    this._pendingResponses = {}

    this._onMessageTimedOut = this._onMessageTimedOut.bind(this)

    this._commandExecutionManager = new CommandExecutionManager(this)
  }

  /**
   * Returns the emitter function that the hub uses.
   * @type {function}
   */
  get emitter () {
    return this._emitter
  }

  /**
   * Sets the emitted function that the hub uses. The function will be
   * called with the name of the event to send (typically @code{fw}) and
   * the message itself
   *
   * @param {function} value  the new emitter function
   */
  set emitter (value) {
    if (this._emitter === value) {
      return
    }

    const error = new EmitterChangedError()
    this._commandExecutionManager.cancelAll(error)
    this.cancelAllPendingResponses()

    this._emitter = value
  }

  /**
   * Cancels all pending responses by rejecting the corresponding promises
   * with an error.
   */
  cancelAllPendingResponses () {
    const pendingResponses = this._pendingResponses
    for (let messageId of Object.keys(pendingResponses)) {
      const pendingResponse = pendingResponses[messageId]
      if (pendingResponse) {
        pendingResponse.reject(new EmitterChangedError())
      }
    }
    this._pendingResponses = {}
  }

  /**
   * Feeds the message hub with an incoming message to process.
   *
   * @param {Object} message  the message to process
   */
  processIncomingMessage (message) {
    const { correlationId } = message

    // If this message is a response to something else, call the associated
    // callback
    if (correlationId) {
      const pendingResponse = this._pendingResponses[correlationId]
      if (pendingResponse) {
        delete this._pendingResponses[correlationId]
        pendingResponse.resolve(message)
      }
    } else {
      // This message is simply a notification, so let's check whether there
      // is an associated notification handler and call that
      const type = message.body ? message.body.type : undefined
      const handlers = this._notificationHandlers[type]
      if (handlers) {
        for (let handler of handlers) {
          handler(message)
        }
      }
    }
  }

  /**
   * Registers the given function as a handler for notifications of the
   * given type.
   *
   * The function will be called for every notification received from the
   * server with the given type. It will <em>not</em> be called for
   * responses or requests.
   *
   * @param {string} type  the type to register the handler for
   * @param {function} handler  the handler that will be called whenever a
   *        notification of the given type is received
   */
  registerNotificationHandler (type, handler) {
    if (!this._notificationHandlers.hasOwnProperty(type)) {
      this._notificationHandlers[type] = []
    }
    this._notificationHandlers[type].push(handler)
  }

  /**
   * Registers multiple notification handlers for messages of given types.
   *
   * See {@link registerNotificationHandler} for more details.
   *
   * @param {Object} typesAndHandlers  object mapping Flockwave message
   *        types to the corresponding handlers to register
   */
  registerNotificationHandlers (typesAndHandlers) {
    for (let type of Object.keys(typesAndHandlers)) {
      this.registerNotificationHandler(type, typesAndHandlers[type])
    }
  }

  /**
   * Sends a Flockwave command request (CMD-REQ) with the given body and
   * positional and keyword arguments and returns a promise that resolves
   * when one of the following events happen:
   *
   * <ul>
   * <li>The server signals an execution failure in a direct CMD-REQ
   * response to the original request. In this case, the promise errors
   * out with an appropriate human-readable message.</li>
   * <li>The server returns the response to the request in a CMD-RESP
   * message. In this case, the promise resolves normally with the
   * CMD-RESP message itself.</li>
   * <li>The server signals a timeout for the request in a CMD-TIMEOUT
   * message. In this case, the promise errors out with an appropriate
   * human-readable message.</li>
   * </ul>
   *
   * The method is a proxy to the similarly named method in the encapsulated
   * CommandExecutionManager.
   *
   * @param  {string}    uavId   ID of the UAV to send the request to
   * @param  {string}    command the command to send to a UAV
   * @param  {Object[]}  args    array of positional arguments to pass along
   *         with the command. May be undefined.
   * @param  {Object}    kwds    mapping of keyword argument names to their
   *         values; these are also passed with the command. May be
   *         undefined.
   * @return {Promise} a promise that resolves to the response of the UAV
   *         to the command or errors out in case of execution errors and
   *         timeouts.
   */
  sendCommandRequest (uavId, command, args, kwds) {
    return this._commandExecutionManager.sendCommandRequest(
      uavId, command, args, kwds)
  }

  /**
   * Sends a Flockwave message with the given body and then return a promise
   * that resolves when the server responds to the message.
   *
   * The promise may also throw an error if the server fails to respond to
   * a message within the time specified by the {@link MessageHub#timeout}
   * property.
   *
   * @param {Object} body  the body of the message to send, or the type of
   *        the message to send (in which case an appropriate body with
   *        only the given type is created)
   * @return {Promise} a promise that resolves to the response of the server
   */
  sendMessage (body = {}) {
    if (!this._emitter) {
      console.warn('sendMessage() was called before associating an emitter ' +
                   'to the message hub. Message was discarded.')
      return Promise.reject(new NoEmitterError())
    }

    const message = createMessage(body)
    return new Promise((resolve, reject) => {
      const pendingResponse = new PendingResponse(message.id, resolve, reject)
      this._pendingResponses[message.id] = pendingResponse

      pendingResponse.timeoutId = setTimeout(this._onMessageTimedOut,
        this.timeout * 1000, message.id)
      this._emitter('fw', message)
    })
  }

  /**
   * Sends a Flockwave notification with the given body. No response is
   * expected to be provided by the server, and therefore no promise will
   * be returned.
   *
   * @param {Object} body  the body of the message to send
   */
  sendNotification (body = {}) {
    if (!this._emitter) {
      console.warn('sendNotification() was called before associating a ' +
                   'socket to the message hub. Message was discarded.')
      return
    }

    this._emitter('fw', createMessage(body))
  }

  /**
   * Handler called when the server failed to provide a response to a
   * message with a given ID within the allowed timeframe.
   *
   * @param {string} messageId  the ID of the message
   */
  _onMessageTimedOut (messageId) {
    console.warn(`Response to message with ID=${messageId} timed out`)
    const pendingResponse = this._pendingResponses[messageId]
    if (pendingResponse) {
      delete this._pendingResponses[messageId]
      pendingResponse.timeout()
    }
  }
}

MessageHub.CommandExecutionTimeout = CommandExecutionTimeout
MessageHub.Timeout = Timeout
