import { type Draft } from '@reduxjs/toolkit';

import { type DocksSliceState } from './slice';
import { type DockState } from './types';

/**
 * Function that updates the state of a dock with the given ID in
 * a state object.
 *
 * @param state - The Redux state object to modify
 * @param id - The identifier of the dock to update
 * @param properties - The new properties of the dock
 */
export function updateStateOfDock(
  state: Draft<DocksSliceState>,
  id: DockState['id'],
  properties: Omit<DockState, 'id'>
): void {
  const dock = state.byId[id];

  if (dock) {
    Object.assign(dock, properties);
  } else {
    state.byId[id] = Object.assign(
      {
        id,
        position: undefined,
      },
      properties
    );
    state.order.push(id);
  }
}
