/**
 * @file Slice of the state object that stores the state of the LCD clock panel.
 */

import { createSlice } from '@reduxjs/toolkit';

import { addItemToBack, deleteItemById } from '~/utils/collections';
import { chooseUniqueId } from '~/utils/naming';

const { actions, reducer } = createSlice({
  name: 'lcd-clock',

  initialState: {
    byId: {
      server: {
        id: 'server',
        clockId: 'system',
        preset: 0,
      },
      show: {
        id: 'show',
        clockId: 'show',
        preset: 1,
      },
    },
    order: ['server', 'show'],
  },

  reducers: {
    addClockDisplay(state, action) {
      const { clockId, preset } = action.payload;
      const id = chooseUniqueId(clockId, state.order);
      addItemToBack(state, { id, clockId, preset });
    },

    removeClockDisplay(state, action) {
      deleteItemById(state, action.payload);
    },

    setClockIdForClockDisplay(state, action) {
      const { id, clockId } = action.payload;
      if (state.byId[id]) {
        state.byId[id].clockId = clockId;
      }
    },

    setPresetIndexForClockDisplay(state, action) {
      const { id, preset } = action.payload;
      if (state.byId[id] && typeof preset === 'number') {
        state.byId[id].preset = preset;
      }
    },
  },
});

export const {
  addClockDisplay,
  removeClockDisplay,
  setClockIdForClockDisplay,
  setPresetIndexForClockDisplay,
} = actions;

export default reducer;
