import { type Draft, type PayloadAction } from '@reduxjs/toolkit';

import { type ServersSliceState } from './slice';
import { type ServerParameters } from './types';

/**
 * Helper function to handle the common parts of `addDetectedServer()` and
 * `addInferredServer()` in the action list.
 */
export function addServer(
  state: Draft<ServersSliceState>,
  type: ServerParameters['type'],
  action: PayloadAction<Omit<ServerParameters, 'id' | 'type'>>
): void {
  const { hostName, label, port, protocol } = action.payload;
  const key = `${hostName}:${port}:${type}:${protocol}`;
  const item = { id: key, hostName, label, port, protocol, type };

  (action as Record<string, unknown>)['key'] = key;

  if (state.detected.byId[key] === undefined) {
    // Server not seen yet; add it to the end
    (action as Record<string, unknown>)['wasAdded'] = true;
    state.detected.order.push(key);
  } else {
    (action as Record<string, unknown>)['wasAdded'] = false;
  }

  state.detected.byId[key] = item;
}
