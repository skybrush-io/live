/**
 * @file Slice of the state object that stores the state of the LCD clock panel.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import {
  addItemToBack,
  type Collection,
  deleteItemById,
} from '~/utils/collections';
import { chooseUniqueId } from '~/utils/naming';

import { type LCDClock } from './types';

type LCDClockSliceState = ReadonlyDeep<Collection<LCDClock>>;

const initialState: LCDClockSliceState = {
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
};

const { actions, reducer } = createSlice({
  name: 'lcd-clock',
  initialState,
  reducers: {
    addClockDisplay(
      state,
      action: PayloadAction<{
        clockId: LCDClock['clockId'];
        preset: LCDClock['preset'];
      }>
    ) {
      const { clockId, preset } = action.payload;
      const id = chooseUniqueId(clockId, state.order);
      addItemToBack(state, { id, clockId, preset });
    },

    removeClockDisplay(state, action: PayloadAction<LCDClock['id']>) {
      deleteItemById(state, action.payload);
    },

    setClockIdForClockDisplay(
      state,
      action: PayloadAction<{
        id: LCDClock['id'];
        clockId: LCDClock['clockId'];
      }>
    ) {
      const { id, clockId } = action.payload;
      const clock = state.byId[id];

      if (clock) {
        clock.clockId = clockId;
      }
    },

    setPresetIndexForClockDisplay(
      state,
      action: PayloadAction<{ id: LCDClock['id']; preset: LCDClock['preset'] }>
    ) {
      const { id, preset } = action.payload;
      const clock = state.byId[id];

      if (clock) {
        clock.preset = preset;
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
