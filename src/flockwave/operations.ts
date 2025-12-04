/**
 * Functions for handling common operations on the Flockwave server using
 * promises.
 */

import type {
  DroneLightsConfiguration,
  DroneShowConfiguration,
  Response_ACKNAK,
  Response_EXTRELOAD,
  Response_EXTSETCFG,
  RTKSurveySettings,
} from '@skybrush/flockwave-spec';

import { errorToString } from '~/error-handling';

import {
  createBulkParameterUploadRequest,
  createFirmwareUploadRequest,
  createParameterSettingRequest,
} from './builders';
import type MessageHub from './messages';
import { extractResponseForId } from './parsing';
import { validateExtensionName, validateObjectId } from './validation';
import type { Message, MessageBody } from './types';
import type {
  AsyncOperationOptions,
  AsyncResponseHandlerOptions,
} from './messages';

/**
 * Asks the server to set a new configuration object for the extension with the
 * given name.
 *
 * Returns whether the operation was successful.
 */
export async function configureExtension(
  hub: MessageHub,
  name: string,
  configuration: unknown
): Promise<boolean> {
  validateExtensionName(name);

  const response: Message<Response_EXTSETCFG> = await hub.sendMessage({
    type: 'EXT-SETCFG',
    ids: { [name]: configuration },
  });

  const status = extractResponseForId(response, name, {
    error: `Failed to retrieve configuration for extension: ${name}`,
  });

  return Boolean(status);
}

/**
 * Asks the server to reload the extension with the given name.
 *
 * Returns whether the operation was successful.
 */
export async function reloadExtension(
  hub: MessageHub,
  name: string
): Promise<boolean> {
  validateExtensionName(name);

  const response: Message<Response_EXTRELOAD> = await hub.sendMessage({
    type: 'EXT-RELOAD',
    ids: [name],
  });

  const status = extractResponseForId(response, name, {
    error: `Failed to reload extension: ${name}`,
  });

  return Boolean(status);
}

/**
 * Asks the server to reset the UAV with the given ID.
 */
export async function resetUAV(hub: MessageHub, uavId: string): Promise<void> {
  try {
    await hub.startAsyncOperationForSingleId(uavId, { type: 'UAV-RST' });
  } catch (error) {
    const errorString = errorToString(error);
    throw new Error(`Failed to reset UAV ${uavId}: ${errorString}`);
  }
}

/**
 * Sends some debugging information to the server.
 */
export async function sendDebugMessage(
  hub: MessageHub,
  message: string
): Promise<void> {
  await hub.sendMessage({
    type: 'X-DBG-RESP',
    data: message,
  });
}

/**
 * Sets the value of a parameter on a single UAV.
 */
export async function setParameter(
  hub: MessageHub,
  { uavId, name, value }: { uavId: string; name: string; value: unknown }
) {
  const command = createParameterSettingRequest(uavId, name, value);
  try {
    await hub.startAsyncOperationForSingleId(uavId, command);
  } catch (error) {
    const errorString = errorToString(error);
    throw new Error(
      `Failed to set parameter ${name} on UAV ${uavId}: ${errorString}`
    );
  }
}

/**
 * Sets the value of multiple parameters on a single UAV.
 *
 * Supported only by server version 2.34.1 or later.
 */
export async function setParameters(
  hub: MessageHub,
  { uavId, parameters }: { uavId: string; parameters: Record<string, unknown> },
  options: AsyncOperationOptions
) {
  const command = createBulkParameterUploadRequest(uavId, parameters);
  let response;

  try {
    response = await hub.startAsyncOperationForSingleId(
      uavId,
      command,
      options
    );
  } catch (error) {
    const errorString = errorToString(error);
    throw new Error(`Failed to set parameters on UAV ${uavId}: ${errorString}`);
  }

  const { failed = [], success = false } = response as any;
  if (!success) {
    if (Array.isArray(failed) && failed.length > 0) {
      throw new Error(
        `Failed to set parameters on UAV ${uavId}: ${failed.slice(0, 5).join(', ')}`
      );
    } else {
      throw new Error(`Failed to set parameters on UAV ${uavId}`);
    }
  }
}

/**
 * Sets the source of the RTK corrections that the server broadcasts to the
 * connected drones.
 */
export async function setRTKCorrectionsSource(
  hub: MessageHub,
  presetId: string
) {
  const response = await hub.sendMessage({
    type: 'X-RTK-SOURCE',
    id: presetId,
  });

  if (response.body.type !== 'ACK-ACK') {
    throw new Error('Failed to set new RTK correction source');
  }
}

/**
 * Sets the configuration of the current drone show on the server.
 */
export async function setShowConfiguration(
  hub: MessageHub,
  config: DroneShowConfiguration
) {
  const response = await hub.sendMessage({
    type: 'SHOW-SETCFG',
    configuration: config,
  });

  if (response.body.type !== 'ACK-ACK') {
    throw new Error('Failed to set new show configuration on the server');
  }
}

/**
 * Takes control of the LED lights of the drones managed by the server, or
 * gives up control, depending on the submitted configuration object.
 */
export async function setShowLightConfiguration(
  hub: MessageHub,
  config: DroneLightsConfiguration
) {
  const response = await hub.sendMessage({
    type: 'SHOW-SETLIGHTS',
    configuration: config,
  });

  if (response.body.type !== 'ACK-ACK') {
    throw new Error('Failed to set new light configuration on the server');
  }
}

/**
 * Asks the RTK framework on the server to start a new survey on the current
 * RTK connection.
 */
export async function startRTKSurvey(
  hub: MessageHub,
  settings: RTKSurveySettings
) {
  const response = await hub.sendMessage({
    type: 'RTK-SURVEY',
    settings,
  });

  if (response.body.type !== 'ACK-ACK') {
    throw new Error('Failed to start RTK survey on the server');
  }
}

/**
 * Sets the RTK antenna position on the server by submitting explicit
 * survey settings that contain a fixed position instead of starting a survey.
 */
export async function setRTKAntennaPosition(
  hub: MessageHub,
  { position, accuracy }: { position: [number, number, number]; accuracy: number }
) {
  const response = await hub.sendMessage({
    type: 'X-RTK-SURVEY',
    settings: {
      position,
      accuracy,
    },
  });

  if (response.body.type !== 'ACK-ACK') {
    throw new Error('Failed to set RTK antenna position on the server');
  }
}

/**
 * Asks the server to upload a drone show specification to a given UAV.
 */
export async function uploadDroneShow(
  hub: MessageHub,
  { uavId, data }: { uavId: string; data: string },
  options: AsyncResponseHandlerOptions
) {
  validateObjectId(uavId);

  // HACK: we are (ab)using the command execution mechanism. This is probably
  // okay as a temporary solution, but we might need a better solution in the
  // long term.
  try {
    await hub.sendCommandRequest(
      {
        uavId,
        command: '__show_upload',
        kwds: {
          show: data,
        },
      },
      {
        timeout: 300 /* five minutes, should be longer than the timeout on the server */,
        ...options,
      }
    );
  } catch (error) {
    throw new Error(
      errorToString(
        (error as any).message || error,
        `Failed to upload show data to UAV ${uavId}`
      )
    );
  }
}

/**
 * Ask the server to update the firmware of a given component.
 */
export async function uploadFirmware(
  hub: MessageHub,
  {
    objectId,
    target,
    blob,
  }: { objectId: string; target: string; blob: string },
  options: Pick<AsyncOperationOptions, 'onProgress'>
) {
  const command = createFirmwareUploadRequest(objectId, target, blob);
  try {
    await hub.startAsyncOperationForSingleId(objectId, command, options);
  } catch (error) {
    const errorString = errorToString(error);
    // Currently we assume that we can only post a firmware update to a UAV;
    // this might change in the future but so far we are okay
    throw new Error(
      `Failed to upload firmware update to UAV ${objectId}: ${errorString}`
    );
  }
}

/**
 * Asks the server to upload a mission in some mission format to a given UAV.
 */
export async function uploadMission(
  hub: MessageHub,
  { uavId, data, format }: { uavId: string; data: string; format: string },
  options: AsyncResponseHandlerOptions
) {
  validateObjectId(uavId);

  // HACK HACK HACK we are (ab)using the command execution mechanism. This is
  // probably okay as a temporary solution, but we might need a better solution
  // in the long term.
  try {
    await hub.sendCommandRequest(
      {
        uavId,
        command: '__mission_upload',
        args: [data, format],
      },
      {
        timeout: 300 /* five minutes, should be longer than the timeout on the server */,
        ...options,
      }
    );
  } catch (error) {
    throw new Error(
      errorToString(
        (error as any).message || error,
        `Failed to upload mission to UAV ${uavId}`
      )
    );
  }
}

/**
 * Custom class of errors representing server side plan generation problems.
 */
export class ServerPlanError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'ServerPlanError';
  }
}

/**
 * Sends a request to the server to plan a mission with the given parameters.
 */
export async function planMission(
  hub: MessageHub,
  { id, parameters }: { id: string; parameters: Record<string, unknown> }
) {
  const response = await hub.sendMessage<
    | (MessageBody<'X-MSN-PLAN'> & { result: Record<string, unknown> })
    | Response_ACKNAK
  >({ type: 'X-MSN-PLAN', id, parameters });

  const { type } = response.body;
  if (type !== 'X-MSN-PLAN') {
    throw new ServerPlanError(response.body.reason);
  }

  const { result } = response.body;
  if (result?.format !== 'skybrush-live/mission-items') {
    throw new Error(
      `Mission plan has an unknown format: ${String(result?.format)}`
    );
  }

  const { payload } = result;
  if (
    !(typeof payload === 'object' && payload !== null) ||
    !('version' in payload && payload?.version == 1) ||
    !('items' in payload && Array.isArray(payload?.items))
  ) {
    throw new Error('Mission plan response must be in version 1 format');
  }

  return payload;
}

const _operations = {
  configureExtension,
  planMission,
  reloadExtension,
  resetUAV,
  sendDebugMessage,
  setParameter,
  setParameters,
  setRTKCorrectionsSource,
  setRTKAntennaPosition,
  setShowConfiguration,
  setShowLightConfiguration,
  startRTKSurvey,
  uploadDroneShow,
  uploadFirmware,
  uploadMission,
};

type RemoveHubArg<F> = F extends (hub: MessageHub, ...args: infer A) => infer R
  ? (...args: A) => R
  : never;
export type OperationExecutor = {
  [K in keyof typeof _operations]: RemoveHubArg<(typeof _operations)[K]>;
};

/**
 * Query handler object that can be used to perform common operations on a
 * Flockwave server using a given message hub.
 */
export const createOperationExecutor = (hub: MessageHub): OperationExecutor =>
  Object.fromEntries(
    Object.entries(_operations).map(([name, func]) => [
      name,
      // @ts-expect-error Correctly annotating this would require dependent
      //                  types, as each operation has different arguments
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      (...args) => func(hub, ...args),
    ])
  ) as OperationExecutor;
