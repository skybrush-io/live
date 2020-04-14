/**
 * @file Functions and constants related to handling connections.
 */

import isUndefined from 'lodash-es/isUndefined';
import mapValues from 'lodash-es/mapValues';
import omitBy from 'lodash-es/omitBy';

import { updateConnections } from '~/features/connections/slice';

/**
 * Enum containing constants for the various connection states.
 */
export const ConnectionState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTING: 'disconnecting',
};

/**
 * Handles a CONN-INF message from a Skybrush server and updates the
 * state of the Redux store appropriately.
 *
 * @param  {Object} body  the body of the CONN-INF message
 * @param  {function} dispatch  the dispatch function of the Redux store
 */
export function handleConnectionInformationMessage(body, dispatch) {
  // Map the status objects from the server into the format expected
  // by our Redux actions. Omit keys for which the values are not
  // provided by the server, and also prevent accidental updates of
  // the master connection
  const states = mapValues(body.status, (statusFromServer) =>
    omitBy(
      {
        id: statusFromServer.id,
        name: statusFromServer.description,
        state: statusFromServer.status,
        stateChangedAt: statusFromServer.timestamp,
      },
      isUndefined
    )
  );
  dispatch(updateConnections(states));
}
