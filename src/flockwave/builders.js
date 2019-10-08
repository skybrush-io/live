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
export const createMessageWithType = type => ({ type });

/**
 * Creates a CMD-REQ (command request) message
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
  const result = createMessageWithType('CMD-REQ');
  result.ids = uavIds;
  result.command = command;
  if (typeof args !== 'undefined') {
    result.args = args;
  }

  if (typeof kwds !== 'undefined') {
    result.kwds = kwds;
  }

  return result;
}
