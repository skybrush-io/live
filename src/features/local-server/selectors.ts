import { createSelector } from '@reduxjs/toolkit';

import type { AppSelector, RootState } from '~/store/reducers';
import { isLocalHost } from '~/utils/networking';
import { EMPTY_ARRAY } from '~/utils/redux';

/**
 * Returns the list of directories in which a local Skybrush server instance
 * will be searched, besides the standard system path.
 *
 * @param state the state of the application
 * @returns the list of directories to add to the system path
 */
export const getLocalServerSearchPath: AppSelector<string[]> = (state) => {
  const result = state.settings.localServer.searchPath;
  return Array.isArray(result) ? result : EMPTY_ARRAY;
};

/**
 * Returns the full path to the executable of a local Skybrush server.
 *
 * @param state the state of the application
 * @returns the full path, or undefined if it is not known yet or
 *     there isn't one
 */
export const getLocalServerExecutable: AppSelector<string | undefined> = (
  state
) => state.localServer.pathScan.result;

/**
 * Returns whether the full path to the executable of a local Skybrush server
 * was found.
 *
 * @param state the state of the application
 * @returns whether the full path to the server was found
 */
export const foundLocalServerExecutable: AppSelector<boolean> = createSelector(
  getLocalServerExecutable,
  (executable) => typeof executable === 'string' && executable.length > 0
);

/**
 * Returns whether a local Skybrush server launched directly by the Skybrush
 * desktop app should be running in the background.
 */
export const shouldManageLocalServer: AppSelector<boolean> = createSelector(
  (state: RootState) => state.dialogs.serverSettings,
  (state: RootState) => state.settings.localServer,
  foundLocalServerExecutable,
  (serverSettings, localServer, found) =>
    Boolean(window.bridge?.localServer) &&
    localServer.enabled &&
    serverSettings.hostName !== undefined &&
    isLocalHost(serverSettings.hostName) &&
    serverSettings.active &&
    found
);
