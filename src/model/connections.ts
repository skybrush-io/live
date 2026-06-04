/**
 * @file Functions and constants related to handling connections.
 */

import type { Response_CONNINF } from '@skybrush/flockwave-spec';
import isUndefined from 'lodash-es/isUndefined';
import mapValues from 'lodash-es/mapValues';
import omitBy from 'lodash-es/omitBy';

import {
  removeConnectionsByIds,
  updateConnections,
} from '~/features/connections/slice';
import type { ConnectionProperties } from '~/features/connections/types';
import type { AppDispatch } from '~/store/reducers';

/**
 * Handles a CONN-DEL message from a server and updates the state of the Redux
 * store appropriately.
 *
 * @param  body  the body of the CONN-DEL message
 * @param  dispatch  the dispatch function of the Redux store
 */
export function handleConnectionDeletionMessage(
  body: { ids: Array<ConnectionProperties['id']> },
  dispatch: AppDispatch
): void {
  dispatch(removeConnectionsByIds(body.ids));
}

/**
 * Handles a CONN-INF message from a Skybrush server and updates the
 * state of the Redux store appropriately.
 *
 * @param  body  the body of the CONN-INF message
 * @param  dispatch  the dispatch function of the Redux store
 */
export function handleConnectionInformationMessage(
  body: Response_CONNINF,
  dispatch: AppDispatch
): void {
  // Map the status objects from the server into the format expected
  // by our Redux actions. Omit keys for which the values are not
  // provided by the server, and also prevent accidental updates of
  // the master connection
  const states = mapValues(
    body.status,
    (statusFromServer) =>
      omitBy(
        {
          id: statusFromServer.id,
          name: statusFromServer.description,
          state: statusFromServer.status,
          stateChangedAt: statusFromServer.timestamp,
        },
        isUndefined
      ) as Omit<ConnectionProperties, 'id'>
  );
  dispatch(updateConnections(states));
}
