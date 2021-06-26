/**
 * Functions for handling common operations on the Flockwave server using
 * promises.
 */

import { extractResponseForId } from './parsing';
import { validateExtensionName } from './validation';

/**
 * Asks the server to set a new configuration object for the extension with the
 * given name.
 */
export async function configureExtension(hub, name, configuration) {
  validateExtensionName(name);

  const response = await hub.sendMessage({
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
 */
export async function reloadExtension(hub, name) {
  validateExtensionName(name);

  const response = await hub.sendMessage({
    type: 'EXT-RELOAD',
    ids: [name],
  });

  const status = extractResponseForId(response, name, {
    error: `Failed to reload extension: ${name}`,
  });

  return Boolean(status);
}

/**
 * Sends some debugging information to the server.
 */
export async function sendDebugMessage(hub, message) {
  await hub.sendMessage({
    type: 'X-DBG-RESP',
    data: message,
  });
}

/**
 * Sets the source of the RTK corrections that the server broadcasts to the
 * connected drones.
 */
export async function setRTKCorrectionsSource(hub, presetId) {
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
export async function setShowConfiguration(hub, config) {
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
export async function setShowLightConfiguration(hub, config) {
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
export async function startRTKSurvey(hub, { accuracy, duration }) {
  const response = await hub.sendMessage({
    type: 'X-RTK-SURVEY',
    settings: {
      accuracy,
      duration,
    },
  });

  if (response.body.type !== 'ACK-ACK') {
    throw new Error('Failed to start RTK survey on the server');
  }
}

/**
 * Asks the server to upload a drone show specification to a given UAV.
 */
export async function uploadDroneShow(hub, { uavId, data }, options) {
  // HACK HACK HACK we are (ab)using the command execution mechanism. This is
  // probably okay as a temporary solution, but we might need a better solution
  // in the long term.
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
  } catch {
    throw new Error(`Failed to upload show data to UAV ${uavId}`);
  }
}

/**
 * Query handler object that can be used to perform common operations on a
 * Flockwave server using a given message hub.
 */
export class OperationExecutor {
  _operations = {
    configureExtension,
    reloadExtension,
    sendDebugMessage,
    setRTKCorrectionsSource,
    setShowConfiguration,
    setShowLightConfiguration,
    startRTKSurvey,
    uploadDroneShow,
  };

  /**
   * Constructor.
   *
   * @param {MessageHub} hub  the message hub to use for communication
   */
  constructor(hub) {
    for (const [name, func] of Object.entries(this._operations)) {
      this[name] = (...args) => func(hub, ...args);
    }
  }
}
