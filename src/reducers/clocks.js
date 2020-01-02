/**
 * @file Reducer function for handling the part of the state object that
 * stores the state of clocks. The clock list includes the clocks that
 * the Flockwave server reports via CLK-LIST and CLK-INF messages.
 */

import has from 'lodash-es/has';
import { handleActions } from 'redux-actions';

/**
 * Default content of the clock registry in the state object.
 */
const defaultState = {
  // Items is a map from clock ID to the state of the clock
  items: {
    // No items are added by default. Here's how an example item should
    // look like:
    // {
    //     format: 'YYYY-MM-DD HH:mm:ss Z',      /* optional */
    //     id: 'system',
    //     referenceTime: 0,                     /* optional */
    //     running: false,
    //     ticks: 0,
    //     ticksPerSecond: 1,                    /* optional, defaults to 1 */
    //     updateFrequency: 1000                 /* optional, in milliseconds, defaults to 1000 */
    // }
  },
  // Order defines the preferred ordering of clocks on the UI
  order: []
};

/**
 * Function that updates the state of a clock with the given ID in
 * a state object. Note that the state object <em>must</em> not be the
 * "real" state object of the Redux store but a copy of it (to avoid
 * mutating the state).
 *
 * @param  {Object} state  the Redux state object to modify
 * @param  {string} id     the identifier of the connection to update
 * @param  {Object} properties  the new properties of the connection
 */
function updateStateOfClock(state, id, properties) {
  const { items } = state;

  if (!has(items, id)) {
    items[id] = {
      id,
      running: false,
      updateFrequency: 1000,
      ticks: 0
    };
    state.order.push(id);
  }

  Object.assign(items[id], properties);
}

/**
 * The reducer function that handles actions related to the clock.
 */
const reducer = handleActions(
  {
    CLEAR_CLOCK_LIST: () => ({
      items: {},
      order: []
    }),

    SET_CLOCK_STATE: (state, action) => {
      const newState = { ...state };
      const { id } = action.payload;
      updateStateOfClock(newState, id, action.payload);
      return newState;
    },

    SET_CLOCK_STATE_MULTIPLE: (state, action) => {
      const newState = { ...state };
      for (const id of Object.keys(action.payload)) {
        updateStateOfClock(newState, id, action.payload[id]);
      }

      return newState;
    }
  },
  defaultState
);

export default reducer;
