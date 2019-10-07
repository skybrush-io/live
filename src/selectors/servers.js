import { ConnectionState } from '~/model/connections'
import { INVALID } from '~/reducers/servers'

import { createSelector } from 'reselect'

/**
 * Returns all the information that we know about the current Flockwave server.
 *
 * @param  {Object}  state  the state of the application
 * @return {boolean} all the information that we know about the current Flockwave
 *     server, directly from the state object
 */
const getCurrentServerState = state => state.servers.current

/**
 * Returns whether we are connected to the remote Flockwave server.
 */
export const isConnected = createSelector(
  getCurrentServerState,
  current => current.state === ConnectionState.CONNECTED
)

/**
 * Returns all the information that we currently know about the authentication
 * methods supported by the current server.
 */
const getAuthenticationSettings = createSelector(
  getCurrentServerState,
  current => (
    current.state === ConnectionState.CONNECTED
      ? current.authentication
      : INVALID
  )
)

/**
 * Returns whether we have valid and up-to-date information about the
 * authentication methods supported by the server we are currently connected
 * to.
 */
export const areServerAuthenticationSettingsValid = createSelector(
  getAuthenticationSettings,
  settings => settings.valid
)

/**
 * Returns whether the server supports at least one authentication method.
 */
export const supportsAuthentication = createSelector(
  getAuthenticationSettings,
  settings => settings.methods && settings.methods.length > 0
)

/**
 * Returns whether the server requires the user to authenticate before
 * doing anything.
 */
export const requiresAuthentication = createSelector(
  getAuthenticationSettings,
  settings => settings.required
)
