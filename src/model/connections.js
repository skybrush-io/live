/**
 * @file Functions and constants related to handling connections.
 */

import _ from 'lodash'

import { setConnectionStateMultiple } from '../actions/connections'
import { parseISODate } from '../utils/parsing'

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

/**
 * Handles a CONN-INF message from a Flockwave server and updates the
 * state of the Redux store appropriately.
 *
 * @param  {Object} body  the body of the CONN-INF message
 * @param  {function} dispatch  the dispatch function of the Redux store
 */
export function handleConnectionInformationMessage (body, dispatch) {
  // Map the status objects from the server into the format expected
  // by our Redux actions. Omit keys for which the values are not
  // provided by the server, and also prevent accidental updates of
  // the master connection
  const states = _(body.status).mapValues(
    statusFromServer => (
      _.omitBy({
        id: statusFromServer.id,
        name: statusFromServer.description,
        state: statusFromServer.status,
        stateChangedAt: parseISODate(statusFromServer.timestamp)
      }, _.isUndefined)
    )
  ).omit(MASTER_CONNECTION_ID).value()
  dispatch(setConnectionStateMultiple(states))
}
