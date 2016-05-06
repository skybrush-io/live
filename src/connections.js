/**
 * @file Functions and constants related to handling connections.
 */

/**
 * Connectin identifier for the master connection leading to the Flockwave
 * server.
 */
export const MASTER_CONNECTION_ID = '__master__'

/**
 * Enum containing constants for the various connection states.
 */
export const ConnectionState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTING: 'disconnecting'
}
