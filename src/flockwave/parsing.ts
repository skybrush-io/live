/**
 * @file Utility functions to parse data out of Flockwave messages.
 */

import type { ErrorMap, Response_ACKNAK } from '@skybrush/flockwave-spec';
import color from 'color';
import get from 'lodash-es/get';
import type { Message, MultiAsyncOperationResponseBody } from './types';

/**
 * Converts a color in RGB565 format to a hex value.
 */
export function convertRGB565ToHex(value: number): number {
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
 * Converts a color in RGB565 format to CSS notation.
 */
export function convertRGB565ToCSSNotation(value: number): string {
  return color(convertRGB565ToHex(value || 0)).string();
}

const MESSAGES_WITH_RECEIPTS: Record<string, boolean> = {
  'FW-UPLOAD': true,
  'LOG-DATA': true,
  'LOG-INF': true,
  'OBJ-CMD': true,
  'PRM-GET': true,
  'PRM-SET': true,
  'UAV-CALIB': true,
  'UAV-FLY': true,
  'UAV-HALT': true,
  'UAV-HOVER': true,
  'UAV-LAND': true,
  'UAV-MOTOR': true,
  'UAV-RST': true,
  'UAV-RTH': true,
  'UAV-SIGNAL': true,
  'UAV-SLEEP': true,
  'UAV-TAKEOFF': true,
  'UAV-TEST': true,
  'UAV-WAKEUP': true,
};

/**
 * Helper function that throws an error if the received message was an
 * ACK-NAK message or a message without a type, and returns the message intact otherwise.
 */
export function ensureNotNAK<T>(message: Message<T>): Message<T> {
  const { body } = message || {};

  /* @ts-ignore */
  const { type } = body || {};

  if (!type) {
    throw new Error('Received message has no type');
  } else if (type === 'ACK-NAK') {
    throw new Error(
      (body as Response_ACKNAK).reason ?? 'ACK-NAK received; no reason given'
    );
  }

  return message;
}

/**
 * Extracts the receipt corresponding to the given object from a multi-object
 * async response from the server. Throws an error if the message represents a
 * failure and no receipt is available.
 *
 * @param  {Object} message   the Skybrush message to parse
 * @param  {string} objectId  the ID of the object whose receipt we wish to
 *         extract from the message
 * @return {object} the receipt or result corresponding to the UAV
 * @throws Error  if the receipt or result cannot be extracted; the message of the
 *         error provides a human-readable reason
 */
export function extractResultOrReceiptFromMaybeAsyncResponse<T>(
  message: Message<Response_ACKNAK | MultiAsyncOperationResponseBody<T>>,
  objectId: string
): { result?: T; receipt?: string } {
  const { body } = ensureNotNAK(message);
  const checkedBody = body as MultiAsyncOperationResponseBody<T>;
  const { type } = checkedBody;

  if (MESSAGES_WITH_RECEIPTS[type]) {
    // We may still have a rejection here
    const { error, receipt, result } = checkedBody;
    if (error && error[objectId] !== undefined) {
      throw new Error(error[objectId] ?? 'Failed to execute command');
    } else if (result && result[objectId] !== undefined) {
      return { result: result[objectId] };
    } else if (receipt && receipt[objectId] !== undefined) {
      return { receipt: receipt[objectId] };
    } else {
      throw new Error(
        'Server did not provide a response or receipt for the command'
      );
    }
  } else {
    throw new Error(`${type} messages do not contain receipts`);
  }
}

/**
 * Extracts the object corresponding to a given ID in a standard response
 * object having keys named `status` and `error` (which is the
 * case for many Flockwave messages.)
 */
export function extractResponseForId<T>(
  message: Message<{
    error?: ErrorMap;
    [k: string]: any;
  }>,
  id: string,
  options: { error?: string; key?: string } = {}
) {
  const errors = message?.body?.error;

  if (typeof errors === 'object' && errors[id] !== undefined) {
    // Response indicates an error for the given ID
    if (typeof errors[id] === 'string') {
      throw new TypeError(errors[id]);
    } else {
      const { error } = options;
      throw new Error(
        error || `Failed to retrieve result for ID ${id} from response`
      );
    }
  }

  const { key = 'status' } = options;
  const results = message?.body?.[key];

  if (
    typeof results === 'object' &&
    results !== null &&
    typeof results[id] !== 'undefined'
  ) {
    return results[id] as T;
  }

  throw new Error(
    `No result for ID ${id} but no error either; this should not have happened.`
  );
}
