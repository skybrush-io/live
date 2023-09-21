import { type Draft } from '@reduxjs/toolkit';

import { ConnectionState } from '~/model/enums';

import { type ConnectionsSliceState } from './slice';
import { type ConnectionProperties } from './types';

const createDefaultItem = (
  id: ConnectionProperties['id']
): ConnectionProperties => ({
  id,
  name: id,
  state: ConnectionState.DISCONNECTED,
  stateChangedAt: undefined,
});

/**
 * Function that updates the state of a connection with the given ID in
 * a state object.
 *
 * The state is updated in-place.
 *
 * @param state - The Redux state object to update
 * @param id - The identifier of the connection to update
 * @param properties - The new properties of the connection
 */
export function updateStateOfConnection(
  state: Draft<ConnectionsSliceState>,
  id: ConnectionProperties['id'],
  properties: Omit<ConnectionProperties, 'id'>
): void {
  const { byId, order } = state;

  byId[id] = { ...(byId[id] ?? createDefaultItem(id)), ...properties };
  if (!order.includes(id)) {
    order.push(id);
  }
}
