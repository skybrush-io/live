/**
 * @file Utility functions to parse data out of Flockwave messages.
 */

import get from 'lodash-es/get';
import includes from 'lodash-es/includes';
import isNil from 'lodash-es/isNil';

/**
 * Converts a color in RGB565 format to a hex value.
 */
export function convertRGB565ToHex(value) {
  const red5 = (value & 0xf800) >> 11;
  const green6 = (value & 0x7e0) >> 5;
  const blue5 = value & 0x1f;
  return (
    (((red5 << 3) + (red5 >> 2)) << 16) |
    (((green6 << 2) + (green6 >> 4)) << 8) |
    ((blue5 << 3) + (blue5 >> 2))
  );
}

/**
 * Extracts the receipt corresponding to the given UAV from a CMD-REQ
 * response from the server. Throws an error if the message represents a
 * failure and no receipt is available.
 *
 * @param  {Object} message the Skybrush message to parse
 * @param  {string} uavId   the ID of the UAV whose receipt we wish to
 *         extract from the message
 * @return {string} the receipt corresponding to the UAV
 * @throws Error  if the receipt cannot be extracted; the message of the
 *         error provides a human-readable reason
 */
export function extractReceiptFromCommandRequest(message, uavId) {
  const { body } = message;
  const { type } = body;

  if (type === 'ACK-NAK') {
    // Server rejected to execute the command
    throw new Error(body.reason || 'ACK-NAK received; no reason given');
  } else if (type === 'CMD-REQ') {
    // We may still have a rejection here
    const { failure, receipts } = body;
    if (failure && includes(failure, uavId)) {
      throw new Error(body.reasons[uavId] || 'Failed to execute command');
    } else if (!receipts || isNil(receipts[uavId])) {
      throw new Error('Server did not provide a receipt for the command');
    } else {
      return receipts[uavId];
    }
  } else {
    throw new Error(`${type} messages do not contain receipts`);
  }
}

/**
 * Extracts the object corresponding to a given ID in a standard response
 * object having keys named `status`, `failure` and `reasons` (which is the
 * case for many Flockwave messages.)
 */
export function extractResponseForId(message, id, options = {}) {
  const failures = get(message, 'body.failure');

  if (Array.isArray(failures) && failures.includes(id)) {
    // Response indicates a failure for the given ID
    const reasons = get(message, 'body.reasons');
    if (typeof reasons === 'object' && typeof reasons[id] === 'string') {
      throw new TypeError(reasons[id]);
    } else {
      const { error } = options;
      throw new Error(
        error || `Failed to retrieve result for ID ${id} from response`
      );
    }
  }

  const results = get(message, 'body.status');
  if (typeof results === 'object' && typeof results[id] !== 'undefined') {
    return results[id];
  }

  throw new Error(
    `No result for ID ${id} but no failure either; this should not have happened.`
  );
}
