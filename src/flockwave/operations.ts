/**
 * Functions for handling common operations on the Flockwave server using
 * promises.
 */

import type {
  DroneLightsConfiguration,
  DroneShowConfiguration,
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
import type { Message } from './types';
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
  presetId: string | null
) {
  const response = await hub.sendMessage({
    type: 'X-RTK-SOURCE',
    id: presetId,
  });

  if (response.body.type !== 'ACK-ACK') {
    const body = response.body as any;
    const errorMessage =
      body.reason ||
      body.error ||
      'Failed to set new RTK correction source';
    throw new Error(errorMessage);
  }
}

/**
 * Creates a new RTK preset on the server.
 */
export async function createRTKPreset(
  hub: MessageHub,
  preset: Record<string, unknown>
) {
  const response = await hub.sendMessage({
    type: 'X-RTK-NEW',
    preset,
  });

  if (response.body.type === 'X-RTK-NEW') {
    return (response.body as any).id;
  }

  if (response.body.type !== 'ACK-ACK') {
    const body = response.body as any;
    const errorMessage =
      body.reason ||
      body.error ||
      'Failed to create RTK preset';
    throw new Error(errorMessage);
  }
}

/**
 * Updates an existing RTK preset on the server.
 */
export async function updateRTKPreset(
  hub: MessageHub,
  presetId: string,
  preset: Record<string, unknown>
) {
  const response = await hub.sendMessage({
    type: 'X-RTK-UPDATE',
    ids: [presetId],
    updates: {
      [presetId]: preset,
    },
  });

  if (
    response.body.type !== 'ACK-ACK' &&
    response.body.type !== 'X-RTK-UPDATE'
  ) {
    const body = response.body as any;
    const errorMessage =
      body.reason ||
      body.error ||
      'Failed to update RTK preset';
    throw new Error(errorMessage);
  }
}

/**
 * Deletes an existing RTK preset from the server.
 */
export async function deleteRTKPreset(hub: MessageHub, presetId: string) {
  const response = await hub.sendMessage({
    type: 'X-RTK-DEL',
    ids: [presetId],
  });

  if (response.body.type !== 'X-RTK-DEL') {
    const body = response.body as any;
    const errorMessage =
      body.reason ||
      body.error ||
      'Failed to delete RTK preset';
    throw new Error(errorMessage);
  }

  extractResponseForId(response, presetId, { key: 'result' });
}

/**
 * Persists all current user presets to disk on the server.
 */
export async function saveRTKPresets(hub: MessageHub) {
  const response = await hub.sendMessage({
    type: 'X-RTK-SAVE',
  });

  if (response.body.type !== 'ACK-ACK') {
    const body = response.body as any;
    const errorMessage =
      body.reason ||
      body.error ||
      'Failed to save RTK presets';
    throw new Error(errorMessage);
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
    const body = response.body as any;
    const errorMessage =
      body.reason ||
      body.error ||
      'Failed to start RTK survey on the server';
    throw new Error(errorMessage);
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
    const body = response.body as any;
    const errorMessage =
      body.reason ||
      body.error ||
      'Failed to set RTK antenna position on the server';
    throw new Error(errorMessage);
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
  constructor(message: string) {
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
  const response = await hub.sendMessage({
    type: 'X-MSN-PLAN',
    id,
    parameters,
  });

  const { type, result } = response.body as any;
  if (type !== 'X-MSN-PLAN') {
    throw new ServerPlanError((response.body as any).reason);
  }

  if (result?.format !== 'skybrush-live/mission-items') {
    throw new Error(`Mission plan has an unknown format: ${result?.format}`);
  }

  const { payload } = result;
  if (payload?.version !== 1 || !Array.isArray(payload.items)) {
    throw new Error('Mission plan response must be in version 1 format');
  }

  return payload;
}

const _operations = {
  configureExtension,
  createRTKPreset,
  deleteRTKPreset,
  planMission,
  reloadExtension,
  resetUAV,
  saveRTKPresets,
  sendDebugMessage,
  setParameter,
  setParameters,
  setRTKAntennaPosition,
  setRTKCorrectionsSource,
  setShowConfiguration,
  setShowLightConfiguration,
  startRTKSurvey,
  updateRTKPreset,
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
export function createOperationExecutor(hub: MessageHub): OperationExecutor {
  const result: Record<string, any> = {};
  for (const [name, func] of Object.entries(_operations)) {
    // @ts-ignore
    result[name] = (...args) => func(hub, ...args);
  }
  return result as any as OperationExecutor;
}
