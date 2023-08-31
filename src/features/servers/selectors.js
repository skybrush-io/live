import isNil from 'lodash-es/isNil';
import { createSelector } from '@reduxjs/toolkit';

import { ConnectionState } from '~/model/enums';
import { selectOrdered } from '~/utils/collections';

import { CLOCK_SKEW_WARNING_THRESHOLD, MAX_ROUNDTRIP_TIME } from './constants';
import { INVALID } from './slice';
import { Protocol } from './types';

/**
 * Returns the current authentication token that the user possesses.
 *
 * @return {string|undefined}  the current authentication token or undefined if
 *         the user has no authentication token
 */
export const getAuthenticationToken = (state) =>
  state.servers.token || undefined;

/**
 * Returns the estimated clock skew between us and the server, in milliseconds.
 *
 * Positive numbers mean that the server is "ahead" us.
 */
export const getClockSkewInMilliseconds = (state) =>
  state.servers.current.timeSync.clockSkew;

/**
 * Returns the estimated clock skew between us and the server, in milliseconds,
 * if it is significant enough, otherwise return zero.
 *
 * Positive numbers mean that the server is "ahead" us.
 */
export const getRoundedClockSkewInMilliseconds = createSelector(
  (state) => state.servers.current.timeSync,
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
export const getRoundTripTimeInMilliseconds = (state) =>
  state.servers.current.timeSync.roundTripTime;

/**
 * Selector that returns the protocol of the server that the user is
 * connected to or that the user is trying to connect to.
 * (Defaults to WebSocket for backwards compatibility.)
 */
export const getServerProtocolWithDefaultWS = (state) =>
  state.dialogs.serverSettings.protocol || Protocol.WS;

/**
 * Selector that returns the hostname of the server that the user is
 * connected to or that the user is trying to connect to.
 */
export const getServerHostname = (state) =>
  state.dialogs.serverSettings.hostName;

/**
 * Selector that returns the port of the server that the user is
 * connected to or that the user is trying to connect to.
 */
export const getServerPort = (state) => state.dialogs.serverSettings.port;

/**
 * Selector that returns the hostname and port of the server that the user is
 * connected to or that the user is trying to connect to.
 */
export const getServerHostnameAndPort = createSelector(
  (state) => state.dialogs.serverSettings,
  ({ hostName, port }) => {
    return hostName ? `${hostName}:${port}` : undefined;
  }
);

/**
 * Selector that returns a unique URL that fully identifies the server we are
 * trying to connect to.
 */
export const getServerUrl = createSelector(
  (state) => state.dialogs.serverSettings,
  ({ hostName, port, isSecure }) => {
    const protocol = isSecure ? 'https:' : 'http:';
    return hostName ? `${protocol}//${hostName}:${port}` : undefined;
  }
);

/**
 * Returns all the information that we know about the current Skybrush server.
 *
 * @param  {Object}  state  the state of the application
 * @return {Object} all the information that we know about the current Skybrush
 *     server, directly from the state object
 */
export const getCurrentServerState = (state) => state.servers.current;

/**
 * Returns the list of features that we know are supported by the current
 * Skybrush server.
 *
 * @param  {Object}  state  the state of the application
 * @return {Object[]}  an object mapping names of features supported by the
 *     current Skybrush server to any additional information we know about the
 *     feature.
 */
const getCurrentServerFeatures = (state) => state.servers.current.features;

/**
 * Returns the license that is currently active on the connected Skybrush
 * server.
 *
 * @param  {Object}  state  the state of the application
 * @return {Object[]}  an object describing the license active on the currently
 *     connected Skybrush server
 */
const getCurrentServerLicense = (state) => state.servers.current.license;

/**
 * Returns the version number of the currently connected Skybrush server.
 *
 * @param  {Object}  state  the state of the application
 * @return {string}  version number of the currently connected Skybrush server
 */
export const getCurrentServerVersion = (state) => state.servers.current.version;

/**
 * Selector that calculates and caches the list of all the servers detected
 * on the local network, in exactly the same order as they should appear on
 * the UI.
 */
export const getDetectedServersInOrder = createSelector(
  (state) => state.servers.detected,
  selectOrdered
);

/**
 * Returns all the information that we currently know about the authentication
 * methods supported by the current server.
 */
const getAuthenticationSettings = createSelector(
  getCurrentServerState,
  (current) =>
    current.state === ConnectionState.CONNECTED
      ? current.authentication
      : INVALID
);

/**
 * Returns the name of the user that is currently authenticated to the server.
 */
export const getAuthenticatedUser = createSelector(
  getAuthenticationSettings,
  (settings) => settings.user
);

/**
 * Returns whether we have valid and up-to-date information about the
 * authentication methods supported by the server we are currently connected
 * to.
 */
export const areServerAuthenticationSettingsValid = createSelector(
  getAuthenticationSettings,
  (settings) => settings.valid
);

/**
 * Returns whether the user is currently authenticated to the remote
 * Skybrush server.
 */
export const isAuthenticated = createSelector(getAuthenticatedUser, Boolean);

/**
 * Returns whether the user is currently attempting to authenticate to the
 * remote Skybrush server.
 *
 * @param  {Object}  state  the state of the application
 * @return {boolean} whether there is an authentication attempt in progress
 */
export const isAuthenticating = (state) => state.servers.isAuthenticating;

/**
 * Returns whether we are connected to the remote Skybrush server.
 */
export const isConnected = createSelector(
  getCurrentServerState,
  (current) => current.state === ConnectionState.CONNECTED
);

/**
 * Returns whether we are currently trying to connect to the remote Skybrush
 * server.
 */
export const isConnecting = createSelector(
  getCurrentServerState,
  (current) => current.state === ConnectionState.CONNECTING
);

/**
 * Returns whether the server supports at least one authentication method.
 */
export const supportsAuthentication = createSelector(
  getAuthenticationSettings,
  (settings) => settings.methods && settings.methods.length > 0
);

/**
 * Creates a selector that returns whether the server supports the feature with
 * the given name.
 */
const makeSupportsFeatureSelector = (name) =>
  createSelector(
    getCurrentServerFeatures,
    (features) => features[name] !== undefined
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
 * Creates a selector that returns true if and only if a license containing
 * the given feature type is active on the currently connected server.
 */
const makeHasLicenseForFeatureTypeSelector = (name) =>
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
export const requiresAuthentication = createSelector(
  getAuthenticationSettings,
  (settings) => settings.required
);

/**
 * Returns whether the server time is being adjusted at the moment.
 */
export const isAdjustingServerTime = (state) =>
  state.servers.current.timeSync.adjusting;

/**
 * Returns whether the clock skew is being (re)calculated at the moment.
 */
export const isCalculatingClockSkew = (state) =>
  state.servers.current.timeSync.calculating;

/**
 * Returns whether the current measured clock skew of the server can be deemed
 * significant (in a sense that we should prompt the user to fix the clocks).
 */
export const isClockSkewSignificant = createSelector(
  (state) => state.servers.current.timeSync,
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
export const isTimeSyncWarningDialogVisible = (state) =>
  state.servers.timeSyncDialog.open;
