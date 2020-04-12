/**
 * Functions for handling common queries to the Flockwave server using
 * promises.
 */

import get from 'lodash-es/get';
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
    ids: [name]
  });

  return extractResponseForId(response, name, {
    error: `Failed to retrieve configuration for extension: ${name}`
  });
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
    promise: true
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
    getShowConfiguration,
    isExtensionLoaded,
    listExtensions
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
