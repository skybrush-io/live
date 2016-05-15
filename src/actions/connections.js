/**
 * @file Actions related to the states of connections
 */

import { createAction } from 'redux-actions'
import { SET_CONNECTION_STATE } from './types'

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
    id, state, stateChangedAt: new Date()
  })
)
