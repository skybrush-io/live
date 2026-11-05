/**
 * @file Subscription to server-side events that notify the client when some
 * shared state on the server (e.g., the show configuration) has changed.
 *
 * The notifications themselves are handled in `~/model/events`, which
 * dispatches them to the handlers registered by the individual features.
 */

import messageHub from '~/message-hub';
import { getRegisteredEventTypes } from '~/model/events';
import type { AppThunk } from '~/store/reducers';

import { getServerVersionValidator } from './selectors';

/**
 * Selector that returns whether the server supports subscribing to
 * server-side events.
 */
const supportsServerEvents = getServerVersionValidator('>=2.61.0');

/**
 * Thunk that subscribes to the server-side events that the client is
 * interested in, if the server supports them.
 */
export const subscribeToServerEvents =
  (): AppThunk<Promise<void>> => async (_dispatch, getState) => {
    const types = getRegisteredEventTypes();
    if (types.length === 0 || !supportsServerEvents(getState())) {
      return;
    }

    try {
      await messageHub.execute.subscribeToEvents(types);
    } catch (error) {
      console.warn('Failed to subscribe to server events:', error);
    }
  };
