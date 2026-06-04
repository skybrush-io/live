import type { Response_DOCKINF } from '@skybrush/flockwave-spec';
import isUndefined from 'lodash-es/isUndefined';
import mapValues from 'lodash-es/mapValues';
import omitBy from 'lodash-es/omitBy';

import { setDockStateMultiple } from '~/features/docks/slice';
import type { DockState } from '~/features/docks/types';
import type { AppDispatch } from '~/store/reducers';

import { mapPosition } from './beacons';

/**
 * Handles a DOCK-INF message from a Skybrush server and updates the
 * state of the Redux store appropriately.
 *
 * @param  body  the body of the DOCK-INF message
 * @param  dispatch  the dispatch function of the Redux store
 */
export function handleDockInformationMessage(
  body: Response_DOCKINF,
  dispatch: AppDispatch
): void {
  // Map the status objects from the server into the format expected
  // by our Redux actions. Omit keys for which the values are not
  // provided by the server.

  const states = mapValues(
    body.status,
    ({ id, position }) =>
      omitBy(
        {
          id,
          position: mapPosition(position),
        },
        isUndefined
      ) as Omit<DockState, 'id'>
  );

  dispatch(setDockStateMultiple(states));
}
