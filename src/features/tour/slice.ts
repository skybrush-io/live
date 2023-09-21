/**
 * @file Slice of the state object that handles the guided tour that appears
 * the first time the user starts up the application.
 */

import { createSlice } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

type TourSliceState = ReadonlyDeep<{
  isOpen: boolean;
  seen: boolean;
}>;

const initialState: TourSliceState = {
  isOpen: false,
  seen: false,
};

const { actions, reducer } = createSlice({
  name: 'tour',
  initialState,
  reducers: {
    dismissTour(state) {
      state.isOpen = false;
      state.seen = true;
    },

    startTour(state) {
      state.isOpen = true;
      // state.seen = true;
    },
  },
});

export const { dismissTour, startTour } = actions;

export default reducer;
