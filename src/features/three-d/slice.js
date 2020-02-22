/**
 * @file Slice of the state object that stores the state of the 3D view.
 */

import { createSlice } from '@reduxjs/toolkit';

const { reducer } = createSlice({
  name: 'three-d',

  initialState: {},

  reducers: {}
});

/*
export const {
  addClockDisplay,
  removeClockDisplay,
  setClockIdForClockDisplay,
  setPresetIndexForClockDisplay
} = actions;
*/

export default reducer;
