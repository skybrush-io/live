/**
 * @file Functions and classes related to dealing with Flockwave messages.
 */

import has from 'lodash-es/has';
import isObject from 'lodash-es/isObject';
import { nanoid } from 'nanoid';
import pDefer from 'p-defer';
import pProps from 'p-props';
import pTimeout from 'p-timeout';

import {
  createCancellationRequest,
  createCommandRequest,
  createMessageWithType,
} from './builders';
import {
  ensureNotNAK,
  extractResultOrReceiptFromMaybeAsyncResponse,
} from './parsing';
import { OperationExecutor } from './operations';
import { QueryHandler } from './queries';
import { validateObjectId } from './validation';
import version from './version';

/**
 * Creates a new Flockwave message ID.
 *
 * @return {string} a new, random Flockwave message ID
 */
const createMessageId = () => nanoid(8);

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
    this.userMessage = 'Response timed out';
    this.hideStackTrace = true;
    this.isTimeout = true;
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
    this.hideStackTrace = true;
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
    this.hideStackTrace = true;
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
    this.hideStackTrace = true;
  }
}

/**
 * Error class thrown by cancel tokens when it fails to cancel the associated
 * operation on the server.
 */
export class CancellationFailedError extends Error {
  constructor(receipt, message) {
    super(message || `Cancellation of operation ${receipt} failed`);
    this.receipt = receipt;
  }
}

/**
 * Cancel token that can be used to ask the server to cancel the execution of
 * a previously submitted asynchronous operation.
 */
class CancelToken {
  constructor(hub) {
    this._hub = hub;
    this._receipt = undefined;
  }

  /**
   * Activates the cancel token by assigning a receipt ID to it.
   *
   * Typically you don't need to call this method; the message hub will activate
   * the token if you submit one along with a command request and the command is
   * executed on the server asynchronously.
   *
   * @param {string} receipt  the receipt ID of the asynchronous operation
   */
  _activate(hub, receipt) {
    if (this._hub !== hub) {
      throw new Error('Cancel token is owned by a different hub');
    }

    if (!receipt) {
      throw new Error('Receipt ID must not be empty');
    }

    if (this._receipt) {
      throw new Error('This token is already activated');
    }

    this._receipt = receipt;
  }

  /**
   * Dispatches a message via the message hub of this cancel token that will
   * cancel the operation associated to this cancel token.
   */
  cancel = async ({ allowFailure } = {}) => {
    if (!this._hub) {
      throw new Error('This token is not activated yet');
    }

    if (!this._receipt) {
      throw new Error('This token has already been used');
    }

    const receipt = this._receipt;
    let failedReceipts;

    try {
      failedReceipts = await this._hub._sendCancellationRequest([receipt]);
    } catch (error) {
      failedReceipts = [receipt];
      if (!allowFailure) {
        console.error(error);
      }
    }

    if (
      !allowFailure &&
      failedReceipts &&
      Object.keys(failedReceipts).length > 0
    ) {
      throw new CancellationFailedError(receipt);
    }
  };
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
 * (OBJ-CMD) via the message hub and we are waiting for the corresponding
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
    /* Call the callback first and then reject because the callback
     * might enqueue a cancellation request first to the server */
    if (this._timeoutCallback) {
      this._timeoutCallback(this.receipt);
    }

    this.reject(new ClientSideCommandExecutionTimeout(this.receipt));
  };

  _processBody = (body) => {
    const { error, result } = body;
    if (error !== undefined) {
      this.reject(new Error(error));
    } else if (result !== undefined) {
      this.resolve(result);
    } else {
      this.reject(new Error('Malformed response was provided by the server'));
    }
  };
}

/**
 * Manager class that keeps track of async operations that are happening on
 * the server and watches the incoming ASYNC-RESP and ASYNC-TIMEOUT messages so
 * it gets notified whenever a pending async operation has finished.
 */
class AsyncOperationManager {
  /**
   * Constructor. Creates a new manager that will attach to the given
   * message hub to inspect the incoming ASYNC-RESP and ASYNC-TIMEOUT messages.
   *
   * @param {MessageHub} hub  the message hub that the manager will attach to
   * @param {number} timeout  number of seconds to wait for an ASYNC-RESP or
   *        ASYNC-TIMEOUT message after having received a receipt in a response
   *        object instead of the actual result (indicating that the operation
   *        is being executed asynchronously on the server). The reference
   *        server implementation waits for 90 seconds before declaring a
   *        timeout, but the vast majority of cases should finish in less than
   *        a minute. The timeout can be overridden on a per-command basis.
   */
  constructor(hub, timeout = 60) {
    this.timeout = timeout;

    this._hub = undefined;
    this._pendingOperations = {};
    this._earlyResponses = {};

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
        'You may not detach an AsyncOperationManager from its message hub'
      );
    }

    this._hub = value;

    if (this._hub) {
      // Register our own notification handlers
      this._hub.registerNotificationHandlers({
        'ASYNC-RESP': this._onResponseReceived,
        'ASYNC-TIMEOUT': this._onTimeoutReceived,
        /* legacy handler, should be removed soon */
        'OBJ-CMD': this._onResponseReceived,
      });
    }
  }

  /**
   * Cancels all pending asynchronous operations on the client side by rejecting
   * the corresponding promises with the given error.
   *
   * @param {Error} error  the error to reject the promises with
   */
  cancelAll(error) {
    const pendingOperations = this._pendingOperations;
    for (const receipt of Object.keys(pendingOperations)) {
      const pendingOperation = pendingOperations[receipt];
      if (pendingOperation) {
        pendingOperation.reject(error);
      }
    }

    this._pendingOperations = {};
    this._earlyResponses = {};
  }

  /**
   * Handles a multi-object async response coming from the server in
   * a response.
   *
   * The multi-object async response contains three sub-objects:
   * <code>result</code>, <code>error</code> and <code>receipt</code>. Each
   * object maps object IDs that a command was executed on into "something".
   * For <code>result</code>, the value is the result of the operation. For
   * <code>error</code>, the value is an error that happened during the
   * operation. For <code>receipt</code>, each value is a unique identifier
   * that indicates that the operation has started executing in the background,
   * asynchronously, and the receipt ID will appear in later <code>ASYNC-RESP</code>
   * and <code>ASYNC-TIMEOUT</code> messages that deliver the <em>real</em>
   * result.
   *
   * This function will return a promise that resolves when one of the following
   * events happen:
   *
   * <ul>
   * <li>The server signalled an execution failure in the response. In this
   * case, the promise errors out with an appropriate human-readable
   * message.</li>
   * <li>The server returned the result directly in the response. In this case,
   * the promise resolves normally with the result.</li>
   * <li>Any of the above, but in a separate notification delivered asynchronously
   * with ASYNC-RESP.</li>
   * <li>The server signalled a timeout for the request in an ASYNC-TIMEOUT
   * message, delivered later. In this case, the promise errors out with an
   * appropriate human-readable message.</li>
   * </ul>
   *
   * @param  {object}  response  the response received from the server that
   *         contains the keys mentioned above
   * @param  {string}  objectId  the ID of the single object whose result we are
   *         interested in
   * @param  {CancelToken} cancelToken  when specified, and the response contains
   *         a receipt ID, the cancel token will be activated with this receipt
   *         ID such that calling its `cancel()` method later on will send
   *         a request to cancel the asynchronous operation corresponding to the
   *         given receipt ID.
   * @param  {boolean} noThrow   when set to true, ensures that the function
   *         does not throw an exception when the async response indicated an
   *         error; returns the error object instead as if it was the result
   * @param  {number?} timeout   when specified and positive, the number of
   *         seconds to wait for a response. When omitted or negative, uses the
   *         default timeout from the async operation manager object
   * @return {Promise} a promise that resolves to the result of the operation
   *         or errors out in case of execution errors and timeouts
   */
  async handleMultiAsyncResponseForSingleId(
    response,
    objectId,
    { cancelToken, noThrow, timeout } = {}
  ) {
    const { receipt, result } = extractResultOrReceiptFromMaybeAsyncResponse(
      response,
      objectId
    );

    if (receipt) {
      const execution = new PendingCommandExecution(receipt, {
        timeout:
          typeof timeout === 'number' && timeout > 0 ? timeout : this.timeout,
        onTimeout: this._onResponseTimedOut,
      });

      if (cancelToken) {
        cancelToken._activate(this._hub, receipt);
      }

      if (this._earlyResponses[receipt]) {
        execution._processBody(this._earlyResponses[receipt]);
        delete this._earlyResponses[receipt];
      }

      this._pendingOperations[receipt] = execution;

      try {
        return await execution.wait();
      } catch (error) {
        if (noThrow) {
          return error;
        }

        throw error;
      } finally {
        delete this._pendingOperations[receipt];
      }
    } else {
      return result;
    }
  }

  /**
   * Handler called when the server returns a response for an async operation in
   * the form of an ASYNC-RESP notification.
   *
   * @param {string} message  the message sent by the server
   */
  _onResponseReceived = (message) => {
    const { id } = message.body;
    const pendingOperation = this._pendingOperations[id];
    if (pendingOperation) {
      pendingOperation._processBody(message.body);
    } else {
      // Sometimes it happens that we get the chance to process response in an
      // ASYNC-RESP message earlier than we've processed the OBJ-CMD message
      // (even though the OBJ-CMD arrived earlier) due to the random execution
      // order of promises. Therefore, if we receive an ASYNC-RESP message with
      // a receipt ID that we don't know, we store it temporarily so we can
      // process it again when we get the OBJ-CMD message.
      //
      // TODO(ntamas): clean up _earlyResponses periodically
      this._earlyResponses[id] = message.body;
    }
  };

  /**
   * Handler called when the server failed to respond with an ASYNC-RESP
   * or ASYNC-TIMEOUT notification in time.
   *
   * Sends a message to the server to cancel the operation, just in case the
   * server is busy chasing its own tail when it shouldn't.
   *
   * @param {string} receipt  the receipt ID for which the server failed
   *        to respond
   */
  _onResponseTimedOut = async (receipt) => {
    console.warn(`Response to operation with receipt=${receipt} timed out`);
    try {
      await this._hub._sendCancellationRequest([receipt]);
    } catch {
      console.warn(
        `Failed to cancel receipt=${receipt} on server after a client-side timeout`
      );
    }
  };

  /**
   * Handler called when the server signals a timeout for an asynchronous
   * operation in the form of an ASYNC-TIMEOUT notification.
   *
   * @param {string} message  the message sent by the server
   */
  _onTimeoutReceived = (message) => {
    const { ids } = message.body;
    for (const id of ids) {
      const pendingOperation = this._pendingOperations[id];
      if (pendingOperation) {
        pendingOperation.serverSideTimeout();
      } else {
        console.warn(`Stale timeout notification received for receipt=${id}`);
      }
    }
  };
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

    this._asyncOperationManager = new AsyncOperationManager(this);
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
    this._asyncOperationManager.cancelAll(error);
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
   * Creates a new cancel token bound to the message hub that can be used to
   * cancel asynchronous operations that were dispatched through this message
   * hub to the server.
   */
  createCancelToken() {
    return new CancelToken(this);
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
   * or rejects when one of the following events happen:
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
   * <li>A cancellation is delivered to the server in an ASYNC-CANCEL request
   * and the server acknowledges the cancellation in the corresponding
   * ASYNC-CANCEL response.</li>
   * </ul>
   *
   * @param  {string}    uavId   ID of the UAV to send the request to
   * @param  {string}    command the command to send to a UAV
   * @param  {Object[]}  args    array of positional arguments to pass along
   *         with the command. May be undefined.
   * @param  {Object}    kwds    mapping of keyword argument names to their
   *         values; these are also passed with the command. May be
   *         undefined.
   * @param  {Object}    options additional options to forward to the
   *         `handleMultiAsyncResponseForSingleId()` method of the
   *         AsyncOperationManager. Typical keys to use are `cancelToken`,
   *         `timeout` and `noThrow`.
   * @return {Promise} a promise that resolves to the response of the UAV
   *         to the command or errors out in case of execution errors and
   *         timeouts.
   */
  async sendCommandRequest({ uavId, command, args, kwds }, options) {
    const request = createCommandRequest([uavId], command, args, kwds);
    const response = await this.sendMessage(request);
    return this._asyncOperationManager.handleMultiAsyncResponseForSingleId(
      response,
      uavId,
      options
    );
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
      throw new NoEmitterError();
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
   * Sends a message to the server whose expected response is a standard
   * multi-object async response with keys named `result`, `error` and
   * `receipt`. (The response to many messages in the protocol specification
   * follow this template). Returns a promise that resolves when _all_ the
   * spawned async operations on the server have resolved to their results or
   * have terminated with an error or a timeout.
   *
   * The promise resolves to a mapping from object IDs to their corresponding
   * results or errors (represented as Error objects).
   */
  async startAsyncOperation(message) {
    const { type: expectedType } = message;
    if (!expectedType) {
      throw new Error('Message must have a type');
    }

    const response = await this.sendMessage(message);
    return this._processMultiAsyncOperationResponse(response, expectedType);
  }

  /**
   * Sends a message to the server whose target is a single object ID and whose
   * expected response is a standard multi-object async response with keys named
   * `result`, `error` and `receipt`. (The response to many messages in the protocol specification
   * follow this template). Returns a promise that resolves when the spawned
   * async operation on the server has resolved to its result or has terminated
   * with an error or a tiemout.
   *
   * The promise resolves to the result if the operation was successful, or
   * rejects if the operation returned an error.
   */
  async startAsyncOperationForSingleId(id, message) {
    const { ids, type: expectedType } = message;
    if (!expectedType) {
      throw new Error('Message must have a type');
    }

    if (ids && !Array.isArray(ids)) {
      throw new Error('Message must not have an ids key');
    }

    validateObjectId(id);

    message.ids = [id];

    const response = await this.sendMessage(message);
    const parsedResponse = await this._processMultiAsyncOperationResponse(
      response,
      expectedType
    );

    if (Object.prototype.hasOwnProperty.call(parsedResponse, id)) {
      const responseForSingleId = parsedResponse[id];
      if (responseForSingleId instanceof Error) {
        throw responseForSingleId;
      } else {
        return responseForSingleId;
      }
    } else {
      throw new Error(`Server did not return a response for ID ${id}`);
    }
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

  /**
   * Helper function to process the response to a multi-object async operation.
   * See <code>startAsyncOperation()</code> for more details.
   */
  async _processMultiAsyncOperationResponse(response, expectedType) {
    if (!response) {
      throw new Error('Response should not be empty');
    } else if (!response.body) {
      throw new Error('Response has no body');
    } else if (response.body.type === 'ACK-NAK') {
      throw new Error(
        `Execution rejected by server; reason: ${
          response.body.reason || 'unknown'
        }`
      );
    } else if (response.body.type !== expectedType) {
      throw new Error(
        `Response has an unexpected type: ${response.body.type}, expected ${expectedType}`
      );
    } else {
      const { body } = response;
      const { error, result, receipt } = body;
      const results = { ...result };

      for (const erroredId of Object.keys(error || [])) {
        results[erroredId] = new Error(String(error[erroredId]));
      }

      for (const idWithReceipt of Object.keys(receipt || [])) {
        try {
          results[idWithReceipt] =
            this._asyncOperationManager.handleMultiAsyncResponseForSingleId(
              response,
              idWithReceipt,
              { noThrow: true }
            );
        } catch (error) {
          results[idWithReceipt] = error;
        }
      }

      return pProps(results);
    }
  }

  /**
   * Sends a Flockwave ASYNC-CANCEL request to cancel the execution of the
   * asynchronous operations with the given receipt IDs.
   *
   * @param  {string[]}  receipts  the receipt IDs of the asynchronous
   *         operations to cancel
   * @return {Promise}  a promise that resolves to an object mapping receipt
   *         IDs to error messages, for all receipt IDs that were _not_
   *         cancelled successfully
   */
  async _sendCancellationRequest(receipts) {
    const request = createCancellationRequest(receipts);
    const response = await this.sendMessage(request);
    const { body } = ensureNotNAK(response);
    const { error } = body;

    if (error && Object.keys(error).length > 0) {
      return error;
    } else {
      return {};
    }
  }
}
