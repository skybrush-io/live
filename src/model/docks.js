import isUndefined from 'lodash-es/isUndefined';
import mapValues from 'lodash-es/mapValues';
import omitBy from 'lodash-es/omitBy';

import { setDockStateMultiple } from '~/features/docks/slice';

import { mapPosition } from './beacons';

/**
 * Handles a DOCK-INF message from a Skybrush server and updates the
 * state of the Redux store appropriately.
 *
 * @param  {Object} body  the body of the DOCK-INF message
 * @param  {function} dispatch  the dispatch function of the Redux store
 */
export function handleDockInformationMessage(body, dispatch) {
  // Map the status objects from the server into the format expected
  // by our Redux actions. Omit keys for which the values are not
  // provided by the server.

  const states = mapValues(body.status, ({ id, position }) =>
    omitBy(
      {
        id,
        position: mapPosition(position),
      },
      isUndefined
    )
  );

  dispatch(setDockStateMultiple(states));
}
