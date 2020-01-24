/**
 * @file Utility functions to parse data out of Skybrush messages.
 */

import includes from 'lodash-es/includes';
import isNil from 'lodash-es/isNil';

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
