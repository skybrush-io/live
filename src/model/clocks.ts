/**
 * @file Functions and constants related to handling clocks.
 */

import type { Response_CLKINF } from '@skybrush/flockwave-spec';
import isUndefined from 'lodash-es/isUndefined';
import mapValues from 'lodash-es/mapValues';
import omitBy from 'lodash-es/omitBy';

import { setClockStateMultiple } from '~/features/clocks/slice';
import type { Clock } from '~/features/clocks/types';
import type { AppDispatch } from '~/store/reducers';
import { parseEpochIdentifierOrISODate } from '~/utils/parsing';

/**
 * Handles a CLK-INF message from a Skybrush server and updates the
 * state of the Redux store appropriately.
 *
 * @param  body  the body of the CLK-INF message
 * @param  dispatch  the dispatch function of the Redux store
 */
export function handleClockInformationMessage(
  body: Response_CLKINF,
  dispatch: AppDispatch
): void {
  // Map the status objects from the server into the format expected
  // by our Redux actions. Omit keys for which the values are not
  // provided by the server.

  const states = mapValues(
    body.status,
    (statusFromServer) =>
      omitBy(
        {
          id: statusFromServer.id,
          epoch: statusFromServer.epoch
            ? parseEpochIdentifierOrISODate(statusFromServer.epoch)
            : undefined,
          referenceTime: statusFromServer.retrievedAt,
          running: statusFromServer.running,
          ticks: statusFromServer.ticks,
          ticksPerSecond: statusFromServer.ticksPerSecond || 1,
        },
        isUndefined
      ) as Omit<Clock, 'id'>
  );

  dispatch(setClockStateMultiple(states));
}
