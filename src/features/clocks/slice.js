/**
 * @file Slice of the state object that stores the last known states of the
 * clocks of the server.
 */

import has from 'lodash-es/has';
import { createSlice } from '@reduxjs/toolkit';

import { clearOrderedCollection } from '~/utils/collections';

/**
 * Function that updates the state of a clock with the given ID in
 * a state object.
 *
 * @param  {Object} state  the Redux state object to modify
 * @param  {string} id     the identifier of the connection to update
 * @param  {Object} properties  the new properties of the clock
 */
function updateStateOfClock(state, id, properties) {
  const { byId } = state;

  if (!has(byId, id)) {
    byId[id] = {
      id,
      running: false,
      updateFrequency: 1000,
      ticks: 0
    };
    state.order.push(id);
  }

  Object.assign(byId[id], properties);
}

const { actions, reducer } = createSlice({
  name: 'clocks',

  initialState: {
    // byId is a map from clock ID to the state of the clock
    byId: {
      // No items are added by default. Here's how an example item should
      // look like:
      // {
      //     format: 'YYYY-MM-DD HH:mm:ss Z',      /* optional */
      //     id: 'system',
      //     epoch: 'unix',                        /* optional */
      //     referenceTime: 0,                     /* optional */
      //     running: false,
      //     ticks: 0,
      //     ticksPerSecond: 1,                    /* optional, defaults to 1 */
      //     updateFrequency: 1000                 /* optional, in milliseconds, defaults to 1000 */
      // }
    },
    // Order defines the preferred ordering of clocks on the UI
    order: []
  },

  reducers: {
    clearClockList(state) {
      clearOrderedCollection(state);
    },

    setClockState(state, action) {
      const { id, ...rest } = action.payload;
      updateStateOfClock(state, id, rest);
    },

    setClockStateMultiple(state, action) {
      const { payload } = action;
      for (const id of Object.keys(payload)) {
        updateStateOfClock(state, id, payload[id]);
      }
    }
  }
});

export const { clearClockList, setClockState, setClockStateMultiple } = actions;

export default reducer;
