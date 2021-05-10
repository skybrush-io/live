/**
 * Functions for handling common queries to the Flockwave server using
 * promises.
 */

import get from 'lodash-es/get';
import pick from 'lodash-es/pick';
import sortBy from 'lodash-es/sortBy';
import memoize from 'memoizee';

import { extractResponseForId } from './parsing';
import { validateExtensionName } from './validation';

/**
 * Returns the current configuration object of the server extension with the
 * given name.
 */
export async function getConfigurationOfExtension(hub, name) {
  validateExtensionName(name);

  const response = await hub.sendMessage({
    type: 'EXT-CFG',
    ids: [name],
  });

  return extractResponseForId(response, name, {
    error: `Failed to retrieve configuration for extension: ${name}`,
  });
}

/**
 * Returns the current license object from the server.
 */
export async function getLicenseInformation(hub) {
  const response = await hub.sendMessage({ type: 'LCN-INF' });
  return response.body &&
    response.body.type === 'LCN-INF' &&
    typeof response.body.license === 'object'
    ? response.body.license
    : { id: '' };
}

/**
 * Returns the current preflight status of a single UAV.
 */
export async function getPreflightStatus(hub, uavId) {
  if (!uavId || typeof uavId !== 'string') {
    throw new Error('Expected non-empty UAV ID');
  }

  const response = await hub.sendMessage({
    type: 'UAV-PREFLT',
    ids: [uavId],
  });
  if (
    response.body?.type === 'UAV-PREFLT' &&
    response.body.result &&
    response.body.result[uavId]
  ) {
    return response.body.result[uavId];
  }

  throw new Error('Unexpected response for preflight status query');
}

/**
 * Returns the list of RTK data sources.
 */
export async function getRTKPresets(hub) {
  let response;

  response = await hub.sendMessage({ type: 'X-RTK-LIST' });
  if (response.body && response.body.type === 'X-RTK-LIST') {
    const rtkSourceIds = get(response, 'body.ids') || [];
    if (rtkSourceIds.length > 0) {
      response = await hub.sendMessage({
        type: 'X-RTK-INF',
        ids: rtkSourceIds,
      });

      const presetsById = get(response, 'body.preset') || {};
      for (const [presetId, preset] of Object.entries(presetsById)) {
        preset.id = presetId;
      }

      return sortBy(Object.values(presetsById), ['title', 'id']);
    }
  } else {
    return [];
  }
}

/**
 * Returns the RTK surveying settings from the server.
 */
export async function getRTKSurveySettings(hub) {
  const response = await hub.sendMessage({ type: 'X-RTK-SURVEY' });
  return response.body &&
    response.body.type === 'X-RTK-SURVEY' &&
    response.body.settings
    ? pick(response.body.settings, ['accuracy', 'duration'])
    : {};
}

/**
 * Returns the status of the RTK subsystem.
 */
export async function getRTKStatus(hub) {
  const response = await hub.sendMessage({ type: 'X-RTK-STAT' });
  if (response.body && response.body.type === 'X-RTK-STAT') {
    return {
      antenna: response.body.antenna,
      messages: response.body.messages,
      cnr: response.body.cnr,
      survey: response.body.survey,
    };
  }

  throw new Error('Unexpected response for RTK subsystem status query');
}

/**
 * Returns the currently selected RTK data source ID.
 */
export async function getSelectedRTKPresetId(hub) {
  const response = await hub.sendMessage({ type: 'X-RTK-SOURCE' });

  if (response.body && response.body.type === 'X-RTK-SOURCE') {
    return get(response, 'body.id');
  }

  return null;
}

/**
 * Returns the configuration of the current drone show managed by the server.
 */
export async function getShowConfiguration(hub) {
  const response = await hub.sendMessage({ type: 'SHOW-CFG' });
  const configuration = get(response, 'body.configuration');
  if (configuration && typeof configuration === 'object') {
    return configuration;
  }

  throw new Error('No show configuration returned');
}

/**
 * Returns the list of loaded extensions and the list of extensions known to
 * the server, in an object with keys named `loaded` and `available`.
 *
 * The response is cached for a short period of time (a few seconds).
 *
 * @param  {MessageHub}  hub  the message hub used to send the message
 */
const listExtensions = memoize(
  async (hub) => {
    const response = await hub.sendMessage('EXT-LIST');
    return response.body;
  },
  {
    maxAge: 5000 /* 5 seconds */,
    promise: true,
  }
);

/**
 * Checks whether the extension with the given name is currently loaded in
 * the server.
 *
 * @param  {MessageHub}  hub  the message hub used to send the message
 * @param  {string}      name  the name of the extension
 *
 * @return {Boolean} whether the extension is loaded
 */
export async function isExtensionLoaded(hub, name) {
  const extensions = await listExtensions(hub);

  if (Array.isArray(get(extensions, 'loaded'))) {
    return extensions.loaded.includes(name);
  }

  return false;
}

/**
 * Query handler object that can be used to initiate queries to a Flockwave
 * server using a given message hub.
 */
export class QueryHandler {
  _queries = {
    getConfigurationOfExtension,
    getLicenseInformation,
    getPreflightStatus,
    getRTKPresets,
    getRTKStatus,
    getRTKSurveySettings,
    getSelectedRTKPresetId,
    getShowConfiguration,
    isExtensionLoaded,
    listExtensions,
  };

  /**
   * Constructor.
   *
   * @param {MessageHub} hub  the message hub to use for communication
   */
  constructor(hub) {
    for (const [name, func] of Object.entries(this._queries)) {
      this[name] = (...args) => func(hub, ...args);
    }
  }
}
