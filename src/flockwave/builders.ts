import type {
  ObjectIDs,
  ReceiptID,
  Request_ASYNCCANCEL,
  Request_ASYNCRESUME,
  Request_FWUPLOAD,
  Request_OBJCMD,
  Request_PRMSET,
  Request_PRMSETMANY,
} from '@skybrush/flockwave-spec';

import arrify from 'arrify';

/**
 * @file Builder functions for commonly used Flockwave messages.
 *
 * If you dispatch a Flockwave message frequently, consider adding a builder
 * function here; this way the actual formatting of the message is abstracted
 * away behind a function and you will only need to change the function body
 * if the Flockwave protocol changes.
 */

export type MessageBody = {
  type: string;
  [k: string]: unknown;
};

/**
 * Creates an ASYNC-CANCEL (cancellation request) message.
 *
 * @param  receiptIds  IDs of the asynchronous operation receipts that should be cancelled
 */
export function createCancellationRequest(
  receiptIds: string | string[]
): Request_ASYNCCANCEL {
  return {
    type: 'ASYNC-CANCEL',
    ids: arrify(receiptIds),
  };
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
export function createResumeRequest(
  receiptIds: string | string[],
  values?: Record<ReceiptID, unknown>
): Request_ASYNCRESUME {
  const result: Request_ASYNCRESUME = {
    type: 'ASYNC-RESUME',
    ids: arrify(receiptIds),
  };

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
 * @param  uavIds  IDs of the UAVs to send the request to
 * @param  command the command to send to a UAV
 * @param  args    array of positional arguments to pass along with the command.
 *         May be undefined.
 * @param  kwds    mapping of keyword argument names to their values; these are
 *         also passed with the command. May be undefined.
 * @return the message
 */
export function createCommandRequest(
  uavIds: ObjectIDs,
  command: string,
  args?: unknown[],
  kwds?: Record<string, unknown>
): Request_OBJCMD {
  const result: Request_OBJCMD = {
    type: 'OBJ-CMD',
    ids: uavIds,
    command,
  };

  if (args !== undefined) {
    result.args = args;
  }

  if (kwds !== undefined) {
    result.kwds = kwds;
  }

  return result;
}

/**
 * Creates a FW-UPLOAD (firmware upload request) message
 *
 * @param  objectIds IDs of objects that should be updated
 * @param  target    firmware update target ID to send the update to
 * @param  blob      the actual contents to be uploaded, encoded as a string
 * @return the message
 */
export function createFirmwareUploadRequest(
  objectIds: string | string[],
  target: string,
  blob: string
): Request_FWUPLOAD {
  return {
    type: 'FW-UPLOAD',
    ids: arrify(objectIds),
    target: String(target),
    blob,
  };
}

/**
 * Creates a PRM-SET (parameter setting request) message
 *
 * @param  {Object[]}  uavIds  IDs of the UAVs to send the request to
 * @param  {string}    name    the name of the parameter to set
 * @param  {Object}    value   the value of the parameter to set
 * @return {Object}  the message
 */
export function createParameterSettingRequest(
  uavIds: string | string[],
  name: string,
  value: unknown
): Request_PRMSET {
  return {
    type: 'PRM-SET',
    ids: arrify(uavIds),
    name: String(name),
    value,
  };
}

/**
 * Creates a PRM-SET-MANY (bulk parameter upload request) message
 *
 * @param  {Object[]}  uavIds  IDs of the UAVs to send the request to
 * @param  {Object}    parameters  mapping of parameter names to their values
 * @return {Object}  the message
 */
export function createBulkParameterUploadRequest(
  uavIds: string | string[],
  parameters: Record<string, unknown>
): Request_PRMSETMANY {
  return {
    type: 'PRM-SET-MANY',
    ids: arrify(uavIds),
    parameters,
  };
}
