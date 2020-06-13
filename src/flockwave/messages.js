/**
 * @file Functions and classes related to dealing with Flockwave messages.
 */

import has from 'lodash-es/has';
import isObject from 'lodash-es/isObject';
import pDefer from 'p-defer';
import pTimeout from 'p-timeout';
import shortid from 'shortid';

import { createCommandRequest, createMessageWithType } from './builders';
import { extractResultOrReceiptFromCommandRequest } from './parsing';
import { OperationExecutor } from './operations';
import { QueryHandler } from './queries';
import version from './version';

/**
 * Creates a new Flockwave message ID.
 *
 * @return {string} a new, random Flockwave message ID
 */
const createMessageId = shortid.generate;

/**
 * Takes an outbound message to send to a UAV as a single string, and
 * parses it to an object consisting of the command itself, the positional
 * and the keyword arguments.
 */
export function parseCommandFromString(string) {
  const parts = string && string.length > 0 ? string.split(/\s+/) : [''];
  return {
    command: parts[0],
    args: parts.slice(1),
    kwds: {},
  };
}

/**
 * Creates a new Flockwave message with the given body.
 *
 * @param {Object} body  the body of the message to send, or the type of
 *        the message to send (in which case an appropriate body with
 *        only the given type is created)
 * @return {Object}  the Flockwave message with the given body
 */
function createMessage(body = {}) {
  if (!isObject(body)) {
    body = createMessageWithType(body);
  }

  return {
    '$fw.version': version,
    id: createMessageId(),
    body,
  };
}

/**
 * Error class thrown by promises when the emitter object of the message
 * hub changes while waiting for a response from the server.
 */
export class EmitterChangedError extends Error {
  constructor(message) {
    super(
      message || 'Message hub emitter changed while waiting for a response'
    );
  }
}

/**
 * Error class thrown when the user attempts to send a message without an
 * emitter being associated to the hub.
 */
export class NoEmitterError extends Error {
  constructor(message) {
    super(message || 'No emitter was associated to the message hub');
  }
}

/**
 * Error class thrown when the server failed to respond to a
 * message in time. This class is exported in MessageHub as
 * <code>MessageHub.Timeout</code>.
 */
export class MessageTimeout extends Error {
  constructor(messageId) {
    super(`Response to message ${messageId} timed out`);
    this.messageId = messageId;
  }
}

/**
 * Error class thrown when the server failed to respond to a
 * command execution request in time, or when it responded with an
 * ASYNC-TIMEOUT message.
 */
export class CommandExecutionTimeout extends Error {
  constructor(receipt) {
    super();
    this.receipt = receipt;
    this.message = `Response to command ${receipt} timed out`;
    this.userMessage = 'Response timed out';
  }
}

/**
 * Error class thrown when the server responded to a request with
 * an ASYNC-TIMEOUT message.
 */
export class ServerSideCommandExecutionTimeout extends CommandExecutionTimeout {
  constructor(receipt) {
    super(receipt);
    this.message += ' (no response from target)';
    this.userMessage += ' (no response from target)';
  }
}

/**
 * Error class thrown when the Skybrush server failed to respond to a
 * command execution request in time.
 */
export class ClientSideCommandExecutionTimeout extends CommandExecutionTimeout {
  constructor(receipt) {
    super(receipt);
    this.message += ' (no response from server)';
    this.userMessage += ' (no response from server)';
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
   * @param {string} messageId  the identifier of the Skybrush message
   *        to which this pending response belongs
   */
  constructor(messageId, { timeout = 5, onTimeout } = {}) {
    this._messageId = messageId;
    this._deferred = pDefer();

    if (timeout > 0) {
      this._timeoutId = setTimeout(this._onTimeout, timeout * 1000);
      this._timeoutCallback = onTimeout;
    } else {
      this._timeoutId = undefined;
      this._timeoutCallback = undefined;
    }
  }

  /**
   * The ID of the message associated to this pending response.
   */
  get messageId() {
    return this._messageId;
  }

  /**
   * Function to call when the response to the message has arrived.
   *
   * @param  {Object} result the response to the message
   */
  resolve(result) {
    this._clearTimeoutIfNeeded();
    this._deferred.resolve(result);
  }

  /**
   * Function to call when we are explicitly rejecting the promise for the
   * response, even if the response has not timed out yet.
   *
   * @param {Error} error  the error to reject the promise with
   */
  reject(error) {
    this._clearTimeoutIfNeeded();
    this._deferred.reject(error);
  }

  /**
   * Waits until the response is resolved, either with a result or with an
   * error.
   */
  async wait() {
    return this._deferred.promise;
  }

  /**
   * Clears the timeout associated to the pending response if needed.
   */
  _clearTimeoutIfNeeded() {
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
      this._timeoutId = undefined;
      this._timeoutCallback = undefined;
    }
  }

  /**
   * Function to call when the response to the request has timed out on the
   * client side, i.e. the client decided that it does not wait for the
   * response from the server any more.
   */
  _onTimeout = () => {
    this.reject(new MessageTimeout(this.messageId));

    if (this._timeoutCallback) {
      this._timeoutCallback(this.receipt);
    }
  };
}

/**
 * Lightweight class that stores the information necessary to resolve or
 * fail the promise that we return when the user sends a command request
 * (CMD-REQ) via the message hub and we are waiting for the corresponding
 * ASYNC-RESP or ASYNC-TIMEOUT message.
 */
class PendingCommandExecution {
  /**
   * Constructor.
   *
   * @param {string} receipt  the receipt of the command execution that we
   *         are waiting for
   * @param {number} timeout  number of seconds to wait for the result of the
   *        command
   */
  constructor(receipt, { timeout = 5, onTimeout } = {}) {
    this._receipt = receipt;
    this._deferred = pDefer();

    if (timeout > 0) {
      this._timeoutId = setTimeout(this._onTimeout, timeout * 1000);
      this._timeoutCallback = onTimeout;
    } else {
      this._timeoutId = undefined;
      this._timeoutCallback = undefined;
    }
  }

  /**
   * The receipt associated to this pending command execution.
   */
  get receipt() {
    return this._receipt;
  }

  /**
   * Function to call when the response to the command execution request has
   * arrived.
   *
   * @param  {Object} result the response to the command execution request
   */
  resolve(result) {
    this._clearTimeoutIfNeeded();
    this._deferred.resolve(result);
  }

  /**
   * Function to call when we are explicitly rejecting the promise for the
   * response, even if the response has not timed out yet.
   *
   * @param {Error} error  the error to reject the promise with
   */
  reject(error) {
    this._clearTimeoutIfNeeded();
    this._deferred.reject(error);
  }

  /**
   * Function to call when the response to the request has timed out on the
   * server side, i.e. the server has signalled that it is not waiting for
   * the execution of the command on the target any more.
   */
  serverSideTimeout() {
    this.reject(new ServerSideCommandExecutionTimeout(this.receipt));
  }

  /**
   * Waits until the response is resolved, either with a result or with an
   * error.
   */
  async wait() {
    return this._deferred.promise;
  }

  /**
   * Clears the timeout associated to the pending response if needed.
   */
  _clearTimeoutIfNeeded() {
    if (this._timeoutId !== undefined) {
      clearTimeout(this.timeoutId);
      this._timeoutId = undefined;
      this._timeoutCallback = undefined;
    }
  }

  /**
   * Function to call when the response to the request has timed out on the
   * client side, i.e. the client decided that it does not wait for the
   * response from the server any more.
   */
  _onTimeout = () => {
    this.reject(new ClientSideCommandExecutionTimeout(this.receipt));

    if (this._timeoutCallback) {
      this._timeoutCallback(this.receipt);
    }
  };
}

/**
 * Manager class that keeps track of command execution requests that were
 * sent to the server and watches the incoming ASYNC-RESP and ASYNC-TIMEOUT
 * messages so it gets notified whenever a pending command execution has
 * finished.
 */
class CommandExecutionManager {
  /**
   * Constructor. Creates a new manager that will attach to the given
   * message hub to inspect the incoming ASYNC-RESP and ASYNC-TIMEOUT messages.
   *
   * @param {MessageHub} hub  the message hub that the manager will attach to
   * @param {number} timeout  number of seconds to wait for an ASYNC-RESP or
   *        ASYNC-TIMEOUT message in response to an OBJ-CMD request before we
   *        consider the command request as timed out. The reference server
   *        implementation waits for 30 seconds before declaring a timeout so
   *        this should probably be larger.
   */
  constructor(hub, timeout = 60) {
    this.timeout = timeout;

    this._hub = undefined;
    this._pendingCommandExecutions = {};

    this._onResponseReceived = this._onResponseReceived.bind(this);
    this._onResponseTimedOut = this._onResponseTimedOut.bind(this);
    this._onTimeoutReceived = this._onTimeoutReceived.bind(this);

    this._attachToHub(hub);
  }

  /**
   * Returns the message hub that the execution manager is attached to.
   */
  get hub() {
    return this._hub;
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
  _attachToHub(value) {
    if (value === this._hub) {
      return;
    }

    if (this._hub) {
      throw new Error(
        'You may not detach a CommandExecutionManager from its message hub'
      );
    }

    this._hub = value;

    if (this._hub) {
      // Register our own notification handlers
      this._hub.registerNotificationHandlers({
        'ASYNC-RESP': this._onResponseReceived,
        'ASYNC-TIMEOUT': this._onTimeoutReceived,
        'OBJ-CMD': this
          ._onResponseReceived /* legacy, should be removed soon */,
      });
    }
  }

  /**
   * Cancels all pending command executions by rejecting the corresponding
   * promises with the given error.
   *
   * @param {Error} error  the error to reject the promises with
   */
  cancelAll(error) {
    const pendingCommandExecutions = this._pendingCommandExecutions;
    for (const receipt of Object.keys(pendingCommandExecutions)) {
      const pendingExecution = pendingCommandExecutions[receipt];
      if (pendingExecution) {
        pendingExecution.reject(error);
      }
    }

    this._pendingCommandExecutions = {};
  }

  /**
   * Sends a Flockwave command request (OBJ-CMD) with the given body and
   * positional and keyword arguments and returns a promise that resolves
   * when one of the following events happen:
   *
   * <ul>
   * <li>The server signals an execution failure in a direct OBJ-CMD
   * response to the original request. In this case, the promise errors
   * out with an appropriate human-readable message.</li>
   * <li>The server returns the response to the request in a direct OBJ-CMD
   * message. In this case, the promise resolves normally with the
   * OBJ-CMD message itself.</li>
   * <li>The server signals a timeout or error for the request in a direct OBJ-CMD
   * message. In this case, the promise errors out with an appropriate
   * human-readable message.</li>
   * <li>Any of the above, but in a separate notification delivered asynchronously
   * with ASYNC-RESP (for responses and errors) or ASYNC-TIMEOUT (for timeouts).</li>
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
   *         timeouts. Note that not the entire response message will be
   *         returned, only the _result_ from the response.
   */
  async sendCommandRequest({ uavId, command, args, kwds }) {
    const request = createCommandRequest([uavId], command, args, kwds);
    const { hub } = this;
    const response = await hub.sendMessage(request);
    const { receipt, result } = extractResultOrReceiptFromCommandRequest(
      response,
      uavId
    );

    if (receipt) {
      const execution = new PendingCommandExecution(receipt, {
        timeout: this.timeout,
        onTimeout: this._onResponseTimedOut,
      });

      this._pendingCommandExecutions[receipt] = execution;
      try {
        return await execution.wait();
      } finally {
        delete this._pendingCommandExecutions[receipt];
      }
    } else {
      return result;
    }
  }

  /**
   * Handler called when the server returns a response for a command
   * execution request in the form of an ASYNC-RESP notification.
   *
   * @param {string} message  the message sent by the server
   */
  _onResponseReceived(message) {
    const { id, error, result } = message.body;
    const pendingCommandExecution = this._pendingCommandExecutions[id];
    if (pendingCommandExecution) {
      if (error !== undefined) {
        pendingCommandExecution.reject(new Error(error));
      } else if (result !== undefined) {
        pendingCommandExecution.resolve(result);
      } else {
        pendingCommandExecution.reject(
          new Error('Malformed response was provided by the server')
        );
      }
    } else {
      console.warn(`Stale command response received for receipt=${id}`);
    }
  }

  /**
   * Handler called when the server failed to respond with an ASYNC-RESP
   * or ASYNC-TIMEOUT notification in time.
   *
   * @param {string} receipt  the receipt ID for which the server failed
   *        to respond
   */
  _onResponseTimedOut(receipt) {
    console.warn(`Response to command with receipt=${receipt} timed out`);
  }

  /**
   * Handler called when the server signals a timeout for a command
   * execution request in the form of an ASYNC-TIMEOUT notification.
   *
   * @param {string} message  the message sent by the server
   */
  _onTimeoutReceived(message) {
    const { ids } = message.body;
    for (const id of ids) {
      const pendingCommandExecution = this._pendingCommandExecutions[id];
      if (pendingCommandExecution) {
        pendingCommandExecution.serverSideTimeout();
      } else {
        console.warn(`Stale command timeout received for receipt=${id}`);
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
  constructor(emitter, timeout = 5) {
    this.emitter = emitter;
    this.timeout = timeout;

    this._notificationHandlers = {};
    this._pendingResponses = {};
    this._waitUntilReadyDeferred = undefined;

    this._executor = undefined;
    this._query = undefined;

    this._onMessageTimedOut = this._onMessageTimedOut.bind(this);

    this._commandExecutionManager = new CommandExecutionManager(this);
  }

  /**
   * Returns the emitter function that the hub uses.
   * @type {function}
   */
  get emitter() {
    return this._emitter;
  }

  /**
   * Sets the emitted function that the hub uses. The function will be
   * called with the name of the event to send (typically @code{fw}) and
   * the message itself
   *
   * @param {function} value  the new emitter function
   */
  set emitter(value) {
    if (this._emitter === value) {
      return;
    }

    const error = new EmitterChangedError();
    this._commandExecutionManager.cancelAll(error);
    this.cancelAllPendingResponses();

    this._emitter = value;

    if (this._emitter && this._waitUntilReadyDeferred) {
      this._waitUntilReadyDeferred.resolve();
      this._waitUntilReadyDeferred = undefined;
    }
  }

  /**
   * Returns an object that can be used to execute commonly used operations on
   * the server via the message hub.
   */
  get execute() {
    if (!this._executor) {
      this._executor = new OperationExecutor(this);
    }

    return this._executor;
  }

  /**
   * Returns an object that can be used to send commonly used queries to the
   * server via the message hub.
   */
  get query() {
    if (!this._query) {
      this._query = new QueryHandler(this);
    }

    return this._query;
  }

  /**
   * Cancels all pending responses by rejecting the corresponding promises
   * with an error.
   */
  cancelAllPendingResponses() {
    const pendingResponses = this._pendingResponses;
    for (const messageId of Object.keys(pendingResponses)) {
      const pendingResponse = pendingResponses[messageId];
      if (pendingResponse) {
        pendingResponse.reject(new EmitterChangedError());
      }
    }
  }

  /**
   * Feeds the message hub with an incoming message to process.
   *
   * @param {Object} message  the message to process
   */
  processIncomingMessage(message) {
    const { refs } = message;

    // If this message is a response to something else, call the associated
    // callback
    if (refs) {
      const pendingResponse = this._pendingResponses[refs];
      if (pendingResponse) {
        pendingResponse.resolve(message);
      }
    } else {
      // This message is simply a notification, so let's check whether there
      // is an associated notification handler and call that
      const type = message.body ? message.body.type : undefined;
      const handlers = this._notificationHandlers[type];
      if (handlers) {
        for (const handler of handlers) {
          handler(message);
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
  registerNotificationHandler(type, handler) {
    if (!has(this._notificationHandlers, type)) {
      this._notificationHandlers[type] = [];
    }

    this._notificationHandlers[type].push(handler);
  }

  /**
   * Registers multiple notification handlers for messages of given types.
   *
   * See {@link registerNotificationHandler} for more details.
   *
   * @param {Object} typesAndHandlers  object mapping Flockwave message
   *        types to the corresponding handlers to register
   */
  registerNotificationHandlers(typesAndHandlers) {
    for (const type of Object.keys(typesAndHandlers)) {
      this.registerNotificationHandler(type, typesAndHandlers[type]);
    }
  }

  /**
   * Unregisters the given function from notifications of the given type.
   *
   * The function won't be called for further notification received.
   *
   * @param {string} type  the type to unregister the handler from
   * @param {function} handler  the handler to unregister
   */
  unregisterNotificationHandler(type, handler) {
    if (
      !has(this._notificationHandlers, type) ||
      !this._notificationHandlers[type].includes(handler)
    ) {
      throw new Error(
        `Unable to unregister handler from ${type}. Handler doesn’t exist.`
      );
    }

    this._notificationHandlers[type].splice(
      this._notificationHandlers[type].indexOf(handler)
    );
  }

  /**
   * Unregisters multiple notification handlers from messages of given types.
   *
   * See {@link unregisterNotificationHandler} for more details.
   *
   * @param {Object} typesAndHandlers  object mapping Flockwave message
   *        types to the corresponding handlers to unregister
   */
  unregisterNotificationHandlers(typesAndHandlers) {
    for (const type of Object.keys(typesAndHandlers)) {
      this.unregisterNotificationHandler(type, typesAndHandlers[type]);
    }
  }

  /**
   * Sends a Flockwave command request (OBJ-CMD) with the given body and
   * positional and keyword arguments and returns a promise that resolves
   * when one of the following events happen:
   *
   * <ul>
   * <li>The server signals an execution failure in a direct OBJ-CMD
   * response to the original request. In this case, the promise errors
   * out with an appropriate human-readable message.</li>
   * <li>The server returns the response to the request in a direct OBJ-CMD
   * message. In this case, the promise resolves normally with the
   * OBJ-CMD message itself.</li>
   * <li>The server signals a timeout or error for the request in a direct OBJ-CMD
   * message. In this case, the promise errors out with an appropriate
   * human-readable message.</li>
   * <li>Any of the above, but in a separate notification delivered asynchronously
   * with ASYNC-RESP (for responses and errors) or ASYNC-TIMEOUT (for timeouts).</li>
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
  sendCommandRequest({ uavId, command, args, kwds }) {
    return this._commandExecutionManager.sendCommandRequest({
      uavId,
      command,
      args,
      kwds,
    });
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
  async sendMessage(body = {}) {
    if (!this._emitter) {
      console.warn(
        'sendMessage() was called before associating an emitter ' +
          'to the message hub. Message was discarded.'
      );
      return Promise.reject(new NoEmitterError());
    }

    const message = createMessage(body);
    const messageId = message.id;

    const pendingResponse = new PendingResponse(messageId, {
      timeout: this.timeout,
      onTimeout: this._onMessageTimedOut,
    });

    this._emitter('fw', message);

    this._pendingResponses[messageId] = pendingResponse;
    try {
      return await pendingResponse.wait();
    } finally {
      delete this._pendingResponses[message.id];
    }
  }

  /**
   * Sends a Flockwave notification with the given body. No response is
   * expected to be provided by the server, and therefore no promise will
   * be returned.
   *
   * @param {Object} body  the body of the message to send
   */
  sendNotification(body = {}) {
    if (!this._emitter) {
      console.warn(
        'sendNotification() was called before associating a ' +
          'socket to the message hub. Message was discarded.'
      );
      return;
    }

    this._emitter('fw', createMessage(body));
  }

  /**
   * Returns a promise that resolves when the message hub received an emitter
   * function that it may use for sending messages.
   *
   * @param {number?} timeout  number of seconds to wait for the promise to
   *        resolve
   * @return {Promise<void>} a promise that resolves when the hub is ready to
   *         send messages
   */
  waitUntilReady(timeout) {
    if (this._emitter !== undefined) {
      return Promise.resolve();
    }

    if (this._waitUntilReadyDeferred === undefined) {
      this._waitUntilReadyDeferred = pDefer();
    }

    if (timeout && timeout > 0) {
      return pTimeout(this._waitUntilReadyDeferred.promise, timeout);
    }

    return this._waitUntilReadyDeferred.promise;
  }

  /**
   * Handler called when the server failed to provide a response to a
   * message with a given ID within the allowed timeframe.
   *
   * @param {string} messageId  the ID of the message
   */
  _onMessageTimedOut(messageId) {
    console.warn(`Response to message with ID=${messageId} timed out`);
  }
}
