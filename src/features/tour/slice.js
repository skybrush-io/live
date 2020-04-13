/**
 * @file Slice of the state object that handles the guided tour that appears
 * the first time the user starts up the application.
 */

import { createSlice } from "@reduxjs/toolkit";

const { actions, reducer } = createSlice({
  name: "tour",

  initialState: {
    isOpen: false,
    seen: false,
  },

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
