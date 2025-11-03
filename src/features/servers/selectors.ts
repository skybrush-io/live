import isNil from 'lodash-es/isNil';
import { createSelector } from '@reduxjs/toolkit';
import { type License } from '@skybrush/flockwave-spec';

import { ConnectionState } from '~/model/enums';
import { type AppSelector, type RootState } from '~/store/reducers';
import { selectOrdered } from '~/utils/collections';

import { CLOCK_SKEW_WARNING_THRESHOLD, MAX_ROUNDTRIP_TIME } from './constants';
import { INVALID, type ServersSliceState } from './slice';
import {
  Protocol,
  type ServerAuthenticationInformation,
  type ServerParameters,
} from './types';

/**
 * Returns the current authentication token that the user possesses.
 *
 * @param state - The state of the application
 * @return The current authentication token or undefined if
 *         the user has no authentication token
 */
export const getAuthenticationToken: AppSelector<string | undefined> = (
  state
) => state.servers.token || undefined;

/**
 * Returns the estimated clock skew between us and the server, in milliseconds.
 *
 * Positive numbers mean that the server is "ahead" us.
 */
export const getClockSkewInMilliseconds: AppSelector<number | undefined> = (
  state
) => state.servers.current.timeSync.clockSkew;

/**
 * Returns the estimated clock skew between us and the server, in milliseconds,
 * if it is significant enough, otherwise return zero.
 *
 * Positive numbers mean that the server is "ahead" us.
 */
export const getRoundedClockSkewInMilliseconds: AppSelector<
  number | undefined
> = createSelector(
  (state: RootState) => state.servers.current.timeSync,
  ({ clockSkew, roundTripTime }) =>
    !isNil(clockSkew) &&
    !isNil(roundTripTime) &&
    roundTripTime <= MAX_ROUNDTRIP_TIME &&
    Math.abs(clockSkew) <= roundTripTime / 2
      ? 0
      : clockSkew
);

/**
 * Returns the estimated round-trip time between us and the server, in milliseconds.
 */
export const getRoundTripTimeInMilliseconds: AppSelector<number | undefined> = (
  state
) => state.servers.current.timeSync.roundTripTime;

/**
 * Selector that returns the protocol of the server that the user is
 * connected to or that the user is trying to connect to.
 * (Defaults to WebSocket for backwards compatibility.)
 */
export const getServerProtocolWithDefaultWS: AppSelector<Protocol> = (state) =>
  state.dialogs.serverSettings.protocol || Protocol.WS;

/**
 * Selector that returns the hostname of the server that the user is
 * connected to or that the user is trying to connect to.
 */
export const getServerHostname: AppSelector<string | undefined> = (state) =>
  state.dialogs.serverSettings.hostName;

/**
 * Selector that returns the port of the server that the user is
 * connected to or that the user is trying to connect to.
 */
export const getServerPort: AppSelector<number> = (state) =>
  state.dialogs.serverSettings.port;

/**
 * Selector that returns the hostname and port of the server that the user is
 * connected to or that the user is trying to connect to.
 */
export const getServerHostnameAndPort: AppSelector<string | undefined> =
  createSelector(
    (state: RootState) => state.dialogs.serverSettings,
    ({ hostName, port }) => {
      return hostName ? `${hostName}:${port}` : undefined;
    }
  );

/**
 * Selector that returns a unique URL that fully identifies the server we are
 * trying to connect to.
 */
export const getServerUrl: AppSelector<string | undefined> = createSelector(
  (state: RootState) => state.dialogs.serverSettings,
  getServerProtocolWithDefaultWS,
  ({ hostName, port, isSecure }, protocol) => {
    const schema =
      protocol === Protocol.WS ? (isSecure ? 'https' : 'http') : protocol;
    return hostName ? `${schema}://${hostName}:${port}` : undefined;
  }
);

/**
 * Selector that attempts to return the URL where the HTTP service of the
 * server is reachable.
 *
 * Returns undefined if it is not known which port the server is listening for
 * HTTP requests.
 */
export const getServerHttpUrl: AppSelector<string | undefined> = createSelector(
  (state: RootState) => state.dialogs.serverSettings,
  (state: RootState) => state.servers.current.ports,
  getServerProtocolWithDefaultWS,
  ({ hostName, isSecure, port }, ports, protocol) => {
    const schema = isSecure ? 'https' : 'http';
    const httpPort = typeof ports['http'] === 'number' ? ports['http'] : 0;
    return hostName && httpPort > 0
      ? `${schema}://${hostName}:${httpPort}`
      : protocol === Protocol.WS
        ? `http://${hostName}:${port}` /* educated guess */
        : `http://${hostName}:${port - 1}`; /* educated guess */
  }
);

/**
 * Selector that returns the version number of the server that we are
 * connected to, or undefined if we are not connected to the server yet.
 */
export const getServerVersion = (state: RootState) =>
  state.servers.current.version;

/**
 * Returns all the information that we know about the current Skybrush server.
 *
 * @param state - The state of the application
 * @return All the information that we know about the current Skybrush
 *         server, directly from the state object
 */
export const getCurrentServerState: AppSelector<
  ServersSliceState['current']
> = (state) => state.servers.current;

/**
 * Returns the list of features that we know are supported by the current
 * Skybrush server.
 *
 * @param state - The state of the application
 * @return An object mapping names of features supported by the current
 *         Skybrush server to any additional information we know about the
 *         feature
 */
const getCurrentServerFeatures: AppSelector<Record<string, boolean>> = (
  state
) => state.servers.current.features;

/**
 * Returns the license that is currently active on the connected Skybrush
 * server.
 *
 * @param state - The state of the application
 * @return An object describing the license active on the currently
 *         connected Skybrush server
 */
const getCurrentServerLicense: AppSelector<License | undefined> = (state) =>
  state.servers.current.license;

/**
 * Selector that returns the mapping of services to ports on the server. May
 * be an empty object if the server is too old and cannot provide the mapping
 * on its own.
 */
export const getCurrentServerPortMapping: AppSelector<
  Record<string, number>
> = (state) => state.servers.current.ports;

/**
 * Returns the version number of the currently connected Skybrush server.
 *
 * @param state - The state of the application
 * @return Version number of the currently connected Skybrush server
 */
export const getCurrentServerVersion: AppSelector<string | undefined> = (
  state
) => state.servers.current.version;

/**
 * Selector that calculates and caches the list of all the servers detected
 * on the local network, in exactly the same order as they should appear on
 * the UI.
 */
export const getDetectedServersInOrder: AppSelector<ServerParameters[]> =
  createSelector((state: RootState) => state.servers.detected, selectOrdered);

/**
 * Returns all the information that we currently know about the authentication
 * methods supported by the current server.
 */
const getAuthenticationSettings: AppSelector<ServerAuthenticationInformation> =
  createSelector(getCurrentServerState, (current) =>
    current.state === ConnectionState.CONNECTED
      ? current.authentication
      : INVALID
  );

/**
 * Returns the name of the user that is currently authenticated to the server.
 */
export const getAuthenticatedUser: AppSelector<string> = createSelector(
  getAuthenticationSettings,
  (settings) => settings.user
);

/**
 * Returns whether we have valid and up-to-date information about the
 * authentication methods supported by the server we are currently connected
 * to.
 */
export const areServerAuthenticationSettingsValid: AppSelector<boolean> =
  createSelector(getAuthenticationSettings, (settings) => settings.valid);

/**
 * Returns whether the user is currently authenticated to the remote
 * Skybrush server.
 */
export const isAuthenticated: AppSelector<boolean> = createSelector(
  getAuthenticatedUser,
  Boolean
);

/**
 * Returns whether the user is currently attempting to authenticate to the
 * remote Skybrush server.
 *
 * @param state - The state of the application
 * @return Whether there is an authentication attempt in progress
 */
export const isAuthenticating: AppSelector<boolean> = (state) =>
  state.servers.isAuthenticating;

/**
 * Returns whether we are connected to the remote Skybrush server.
 */
export const isConnected: AppSelector<boolean> = createSelector(
  getCurrentServerState,
  (current) => current.state === ConnectionState.CONNECTED
);

/**
 * Returns whether we are currently trying to connect to the remote Skybrush
 * server.
 */
export const isConnecting: AppSelector<boolean> = createSelector(
  getCurrentServerState,
  (current) => current.state === ConnectionState.CONNECTING
);

/**
 * Returns whether the server supports at least one authentication method.
 */
export const supportsAuthentication: AppSelector<boolean> = createSelector(
  getAuthenticationSettings,
  (settings) => settings.methods && settings.methods.length > 0
);

/**
 * Creates a selector that returns whether the server supports the feature with
 * the given name.
 */
const makeSupportsFeatureSelector = (name: string): AppSelector<boolean> =>
  createSelector(getCurrentServerFeatures, (features) =>
    Boolean(features[name])
  );

/**
 * Returns whether the server we are connected to supports virtual drones.
 */
export const supportsVirtualDrones =
  makeSupportsFeatureSelector('virtual_uavs');

/**
 * Returns whether the server we are connected to supports offline map caching.
 */
export const supportsMapCaching = makeSupportsFeatureSelector('map_cache');

/**
 * Returns whether the server we are connected to supports studio operations.
 */
export const supportsStudioInterop = makeSupportsFeatureSelector('studio');

/**
 * Creates a selector that returns true if and only if a license containing
 * the given feature type is active on the currently connected server.
 */
const makeHasLicenseForFeatureTypeSelector = (
  name: string
): AppSelector<boolean | undefined> =>
  createSelector(getCurrentServerLicense, (license) =>
    license?.features?.some((feature) => feature.type === name)
  );

/**
 * Returns whether the server we are connected to has an activated license,
 * which enables pro features.
 */
export const hasLicenseWithProFeatures =
  makeHasLicenseForFeatureTypeSelector('pro');

/**
 * Returns whether the server requires the user to authenticate before
 * doing anything.
 */
export const requiresAuthentication: AppSelector<boolean> = createSelector(
  getAuthenticationSettings,
  (settings) => settings.required
);

/**
 * Returns whether the server time is being adjusted at the moment.
 */
export const isAdjustingServerTime: AppSelector<boolean | undefined> = (
  state
) => state.servers.current.timeSync.adjusting;

/**
 * Returns whether the clock skew is being (re)calculated at the moment.
 */
export const isCalculatingClockSkew: AppSelector<boolean | undefined> = (
  state
) => state.servers.current.timeSync.calculating;

/**
 * Returns whether the current measured clock skew of the server can be deemed
 * significant (in a sense that we should prompt the user to fix the clocks).
 */
export const isClockSkewSignificant: AppSelector<boolean> = createSelector(
  (state: RootState) => state.servers.current.timeSync,
  ({ clockSkew, roundTripTime }) =>
    !isNil(clockSkew) &&
    !isNil(roundTripTime) &&
    Math.abs(clockSkew) >
      Math.max(roundTripTime / 2, CLOCK_SKEW_WARNING_THRESHOLD)
);

/**
 * Returns whether the dialog box informing the user about the dangers of a
 * clock skew is visible.
 */
export const isTimeSyncWarningDialogVisible: AppSelector<boolean> = (state) =>
  state.servers.timeSyncDialog.open;
