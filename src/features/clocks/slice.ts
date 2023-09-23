/**
 * @file Slice of the state object that stores the last known states of the
 * clocks of the server.
 */

import { createSlice, type Draft, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import {
  clearOrderedCollection,
  type Collection,
  EMPTY_COLLECTION,
} from '~/utils/collections';

import { type Clock } from './types';
import { updateStateOfClock } from './utils';

export type ClocksSliceState = ReadonlyDeep<Collection<Clock>>;

const initialState: ClocksSliceState = EMPTY_COLLECTION;

const { actions, reducer } = createSlice({
  name: 'clocks',
  initialState,
  reducers: {
    clearClockList(state) {
      clearOrderedCollection<Clock>(state);
    },

    setClockState(state, { payload: { id, ...rest } }: PayloadAction<Clock>) {
      updateStateOfClock(state, id, rest);
    },

    setClockStateMultiple(
      state,
      { payload }: PayloadAction<Record<Clock['id'], Omit<Clock, 'id'>>>
    ) {
      for (const [id, clock] of Object.entries(payload)) {
        updateStateOfClock(state, id, clock);
      }
    },
  },
});

export const { clearClockList, setClockState, setClockStateMultiple } = actions;

export default reducer;
