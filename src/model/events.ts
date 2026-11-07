/**
 * @file Functions and constants related to handling server-side events that
 * notify the client when some shared state on the server (e.g., the show
 * configuration) has changed, so the client can retrieve the new state.
 *
 * Features register handlers for the events they are interested in with
 * `registerEventHandlers()`; the client subscribes to all the events with
 * registered handlers when it connects to the server.
 */

import type { Action } from '@reduxjs/toolkit';

import type { EventBody, Notification_EVTINF } from '@skybrush/flockwave-spec';

import type { AppDispatch, AppThunk } from '~/store/reducers';

/**
 * Function that creates the action to dispatch when a server-side event
 * occurs. Receives the body of the event, or `undefined` if the event has no
 * body.
 */
export type ServerEventHandler = (
  body: EventBody | undefined
) => Action<string> | AppThunk;

/**
 * Mapping from the types of the server-side events that the client subscribes
 * to, to the handlers of the events.
 */
const EVENT_HANDLERS: Record<string, ServerEventHandler> = {};

/**
 * Registers handlers for server-side events.
 *
 * @param  handlers  object mapping event types to the corresponding handlers
 * @return a function that unregisters the handlers when called
 * @throws Error  if a handler is already registered for one of the event types
 */
export function registerEventHandlers(
  handlers: Record<string, ServerEventHandler>
): () => void {
  for (const type of Object.keys(handlers)) {
    if (EVENT_HANDLERS[type]) {
      throw new Error(`Handler for event type ${type} is already registered`);
    }
  }

  Object.assign(EVENT_HANDLERS, handlers);

  return () => {
    for (const [type, handler] of Object.entries(handlers)) {
      if (EVENT_HANDLERS[type] === handler) {
        delete EVENT_HANDLERS[type];
      }
    }
  };
}

/**
 * Returns the types of the server-side events that have registered handlers.
 */
export const getRegisteredEventTypes = (): string[] =>
  Object.keys(EVENT_HANDLERS);

/**
 * Handles an EVT-INF message from a Skybrush server and dispatches the
 * appropriate actions to the Redux store.
 *
 * @param  body  the body of the EVT-INF message
 * @param  dispatch  the dispatch function of the Redux store
 */
export function handleEventNotificationMessage(
  body: Notification_EVTINF,
  dispatch: AppDispatch
): void {
  const events = body?.events;
  if (!Array.isArray(events)) {
    return;
  }

  for (const event of events) {
    const { type, body } = event ?? {};
    const handler = EVENT_HANDLERS[type];
    if (handler) {
      dispatch(handler(body));
    }
  }
}
