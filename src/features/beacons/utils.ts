import { type Draft } from '@reduxjs/toolkit';

import { type BeaconsSliceState } from './slice';
import { type Beacon } from './types';

/**
 * Function that updates the state of a beacon with the given ID in
 * a state object.
 *
 * @param state - The Redux state object to modify
 * @param id - The identifier of the beacon to update
 * @param properties - The new properties of the beacon
 */
export function updateStateOfBeacon(
  state: Draft<BeaconsSliceState>,
  id: Beacon['id'],
  properties: Omit<Beacon, 'id'>
): void {
  const beacon = state.byId[id];

  if (beacon) {
    Object.assign(beacon, properties);
  } else {
    state.byId[id] = Object.assign(
      {
        id,
        position: undefined,
        heading: undefined,
        active: false,
      },
      properties
    );
    state.order.push(id);
  }
}
