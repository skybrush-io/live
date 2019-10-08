/**
 * @file Actions related to the states of connections
 */

import { createAction } from 'redux-actions';
import {
  CLEAR_CONNECTION_LIST,
  SET_CONNECTION_STATE,
  SET_CONNECTION_STATE_MULTIPLE
} from './types';

/**
 * Action factory that creates an action that will clear the list of
 * connections, <em>except</em> for the master connection to the server.
 */
export const clearConnectionList = createAction(CLEAR_CONNECTION_LIST);

/**
 * Action factory that creates an action that will set the state of a
 * connection and also update the timestamp that stores when the connection
 * changed its state the last time.
 *
 * @param  {string}  id     the identifier of the connection whose state has
 *                          changed
 * @param  {string}  state  the new state of the connection
 */
export const setConnectionState = createAction(
  SET_CONNECTION_STATE,
  (id, state) => ({
    id,
    state,
    stateChangedAt: new Date()
  })
);

/**
 * Action factory that creates an action that will set the state of multiple
 * connections at the same time.
 *
 * The payload of the action must be an object mapping connection IDs to
 * the fields in the Redux state object that have to be updated. The
 * <code>stateChangedAt</code> member of the state object is not updated
 * automatically.
 */
export const setConnectionStateMultiple = createAction(
  SET_CONNECTION_STATE_MULTIPLE
);
