/**
 * Functions for handling common queries to the Flockwave server using
 * promises.
 */

import get from 'lodash-es/get';

/**
 * Returns the current configuration object of the server extension with the
 * given name.
 */
export async function getConfigurationOfExtension(hub, name) {
  if (name.includes('.')) {
    throw new Error(`Invalid extension name: ${name}`);
  }

  const response = await hub.sendMessage({
    type: 'EXT-CFG',
    ids: [name]
  });

  const configuration = get(response, `body.status.${name}`);
  if (!configuration) {
    // No such extension, most likely.
    const reason = get(response, `body.reasons.${name}`);
    throw new Error(
      reason || `Failed to retrieve configuration for extension: ${name}`
    );
  }

  return configuration;
}

/**
 * Checks whether the extension with the given name is currently loaded in
 * the server.
 *
 * @param  {Messagehub}  hub  the message hub used to send the message
 * @param  {string}      name  the name of the extension
 *
 * @return {Boolean} whether the extension is loaded
 */
export async function isExtensionLoaded(hub, name) {
  const response = await hub.sendMessage('EXT-LIST');

  /* TODO(ntamas): cache the EXT-LIST response for a few seconds */

  if (Array.isArray(get(response, 'body.loaded'))) {
    return response.body.loaded.includes(name);
  }

  return false;
}

/**
 * Query handler object that can be used to initiate queries to a Flockwave
 * server using a given message hub.
 *
 * The entry point is the `sendQuery()`
 */
export class QueryHandler {
  _queries = {
    getConfigurationOfExtension,
    isExtensionLoaded
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
