import { createSelector } from '@reduxjs/toolkit';

import { isLocalHost } from '~/utils/networking';

/**
 * Returns the list of directories in which a local Flockwave server instance
 * will be searched, besides the standard system path.
 *
 * @param  {Object}  state  the state of the application
 * @return {string[]}  the list of directories to add to the system path
 */
export const getLocalServerSearchPath = state =>
  state.settings.localServer.searchPath;

/**
 * Returns the full path to the executable of a local Flockwave server.
 *
 * @param  {Object}  state  the state of the application
 * @return {string|undefined}  the full path
 */
export const getLocalServerExecutable = state =>
  state.localServer.pathScan.result;

/**
 * Returns whether the full path to the executable of a local Flockwave server
 * was found.
 *
 * @param  {Object}  state  the state of the application
 * @return {boolean}  whether the full path to the server was found
 */
export const foundLocalServerExecutable = createSelector(
  getLocalServerExecutable,
  executable => typeof executable === 'string' && executable.length > 0
);

/**
 * Returns whether a local Flockwave server launched directly by the Flockwave
 * desktop app should be running in the background.
 */
export const shouldManageLocalServer = createSelector(
  state => state.dialogs.serverSettings,
  state => state.settings.localServer,
  foundLocalServerExecutable,
  (serverSettings, localServer, found) =>
    window.bridge &&
    window.bridge.localServer &&
    localServer.enabled &&
    isLocalHost(serverSettings.hostName) &&
    serverSettings.active &&
    found
);
