/**
 * @file Functions and constants related to handling clocks.
 */

import _ from 'lodash'

import { setClockStateMultiple } from './actions/clocks'
import { dateToTimestamp, parseEpochIdentifierOrISODate, parseISODate } from './utils/parsing'

/**
 * Handles a CLK-INF message from a Flockwave server and updates the
 * state of the Redux store appropriately.
 *
 * @param  {Object} body  the body of the CLK-INF message
 * @param  {function} dispatch  the dispatch function of the Redux store
 */
export function handleClockInformationMessage (body, dispatch) {
  // Map the status objects from the server into the format expected
  // by our Redux actions. Omit keys for which the values are not
  // provided by the server.

  const states = _(body.status).mapValues(
    statusFromServer => (
      _.omitBy({
        id: statusFromServer.id,
        epoch: dateToTimestamp(
          parseEpochIdentifierOrISODate(statusFromServer.epoch)
        ),
        referenceTime: dateToTimestamp(
          parseISODate(statusFromServer.retrievedAt)
        ),
        running: statusFromServer.running,
        ticks: statusFromServer.timestamp,
        ticksPerSecond: statusFromServer.ticksPerSecond || 1
      }, _.isUndefined)
    )
  ).value()
  dispatch(setClockStateMultiple(states))
}
