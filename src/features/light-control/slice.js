/**
 * @file Slice of the state object that stores the status of the light control
 * panel in the appplication.
 */

import { createSlice } from '@reduxjs/toolkit';

const { actions, reducer } = createSlice({
  name: 'lightControl',

  initialState: {
    active: false,
    color: '#ffffff',
  },

  reducers: {
    // Internal action; do not use directly unless you know what you are
    // doing because chances are that you need a side effect that informs
    // the server about the change.
    setColor(state, action) {
      if (typeof action.payload === 'string') {
        state.color = action.payload;
      }
    },

    // Internal action; do not use directly unless you know what you are
    // doing because chances are that you need a side effect that informs
    // the server about the change.
    setLightControlActive(state, action) {
      state.active = Boolean(action.payload);
    },
  },
});

export const {
  // Internal actions; do not use directly unless you know what you are
  // doing because chances are that you need a side effect that informs
  // the server about the change.
  setColor,
  setLightControlActive,
} = actions;

export default reducer;
