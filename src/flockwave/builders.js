import arrify from 'arrify';

/**
 * @file Builder functions for commonly used Flockwave messages.
 *
 * If you dispatch a Flockwave message frequently, consider adding a builder
 * function here; this way the actual formatting of the message is abstracted
 * away behind a function and you will only need to change the function body
 * if the Flockwave protocol changes.
 */

/**
 * Creates a message with the given type.
 *
 * @param  {string}  type  the type of the message
 * @return {Object}  the message
 */
export const createMessageWithType = (type) => ({ type });

/**
 * Creates an ASYNC-CANCEL (cancellation request) message.
 *
 * @param  {string|string[]}  receiptIds  ID of the asynchronous operation receipts that
 *         should be cancelled
 */
export function createCancellationRequest(receiptIds) {
  const result = createMessageWithType('ASYNC-CANCEL');
  result.ids = arrify(receiptIds);
  return result;
}

/**
 * Creates an ASYNC-RESUME (resume request) message.
 *
 *
 * @param  {string|string[]}  receiptIds  ID of the asynchronous operation
 *         receipts that should be resumed
 * @param  {Object}  values  mapping of receipt IDs to the objects that should be
 *         posted with the resume request
 */
export function createResumeRequest(receiptIds, values) {
  const result = createMessageWithType('ASYNC-RESUME');
  result.ids = arrify(receiptIds);

  if (values !== undefined) {
    result.values = {};
    for (const receiptId of receiptIds) {
      if (values[receiptId] !== undefined) {
        result.values[receiptId] = values[receiptId];
      }
    }
  }

  return result;
}

/**
 * Creates an OBJ-CMD (command request) message
 *
 * @param  {Object[]}  uavIds  IDs of the UAVs to send the request to
 * @param  {string}    command the command to send to a UAV
 * @param  {Object[]}  args    array of positional arguments to pass along
 *         with the command. May be undefined.
 * @param  {Object}    kwds    mapping of keyword argument names to their
 *         values; these are also passed with the command. May be
 *         undefined.
 * @return {Object}  the message
 */
export function createCommandRequest(uavIds, command, args, kwds) {
  const result = createMessageWithType('OBJ-CMD');
  result.ids = uavIds;
  result.command = command;

  if (args !== undefined) {
    result.args = args;
  }

  if (kwds !== undefined) {
    result.kwds = kwds;
  }

  return result;
}

/**
 * Creates a PRM-SET (parameter setting request) message
 *
 * @param  {Object[]}  uavIds  IDs of the UAVs to send the request to
 * @param  {string}    name    the name of the parameter to set
 * @param  {Object}    value   the value of the parameter to set
 * @return {Object}  the message
 */
export function createParameterSettingRequest(uavIds, name, value) {
  const result = createMessageWithType('PRM-SET');
  result.ids = arrify(uavIds);
  result.name = String(name);
  result.value = value;
  return result;
}
