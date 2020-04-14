/**
 * @file Functions and constants related to handling clocks.
 */

import isUndefined from 'lodash-es/isUndefined';
import mapValues from 'lodash-es/mapValues';
import omitBy from 'lodash-es/omitBy';

import { setClockStateMultiple } from '~/features/clocks/slice';
import { parseEpochIdentifierOrISODate } from '~/utils/parsing';

/**
 * Handles a CLK-INF message from a Skybrush server and updates the
 * state of the Redux store appropriately.
 *
 * @param  {Object} body  the body of the CLK-INF message
 * @param  {function} dispatch  the dispatch function of the Redux store
 */
export function handleClockInformationMessage(body, dispatch) {
  // Map the status objects from the server into the format expected
  // by our Redux actions. Omit keys for which the values are not
  // provided by the server.

  const states = mapValues(body.status, (statusFromServer) =>
    omitBy(
      {
        id: statusFromServer.id,
        epoch: parseEpochIdentifierOrISODate(statusFromServer.epoch),
        referenceTime: statusFromServer.retrievedAt,
        running: statusFromServer.running,
        ticks: statusFromServer.ticks,
        ticksPerSecond: statusFromServer.ticksPerSecond || 1,
      },
      isUndefined
    )
  );

  dispatch(setClockStateMultiple(states));
}
