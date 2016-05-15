/**
 * @file Functions and classes related to dealing with Flockwave messages.
 */

import isObject from 'lodash/isObject'
import MersenneTwister from 'mersenne-twister'
import radix64 from 'radix-64'

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
    body = { 'type': body }
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
class Timeout extends Error {
  constructor (messageId) {
    super(`Response to message ${messageId} timed out`)
    this.messageId = messageId
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
 * Message hub class that can be used to send Flockwave messages and get
 * promises that will resolve when the server responds to them.
 */
export default class MessageHub {
  /**
   * Constructor.
   *
   * @param {function} emitter  a function to call when the hub wants to
   *        emit a new message
   * @param {number}  timeout  number of seconds to wait for a response for
   *        a message from the server before we consider it as a timeout
   */
  constructor (emitter, timeout = 5) {
    this.emitter = emitter
    this.timeout = timeout

    this._pendingResponses = {}
    this._onMessageTimedOut = this._onMessageTimedOut.bind(this)
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
    }
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
      const pendingResponse = new PendingResponse(message.id, resolve)
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

MessageHub.Timeout = Timeout
