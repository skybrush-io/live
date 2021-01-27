/**
 * @file Slice of the state object that stores the status of the light control
 * panel in the appplication.
 */

import { createSlice } from '@reduxjs/toolkit';

import { noPayload } from '~/utils/redux';

const { actions, reducer } = createSlice({
  name: 'lightControl',

  initialState: {
    active: false,
    color: '#ffffff',
  },

  reducers: {
    setColor(state, action) {
      if (typeof action.payload === 'string') {
        state.color = action.payload;
      }
    },

    setColorAndActivate(state, action) {
      if (typeof action.payload === 'string') {
        state.color = action.payload;
        state.active = true;
      }
    },

    setLightControlActive(state, action) {
      state.active = Boolean(action.payload);
    },

    toggleLightControlActive: noPayload((state) => {
      state.active = !state.active;
    }),
  },
});

export const {
  setColor,
  setColorAndActivate,
  setLightControlActive,
  toggleLightControlActive,
} = actions;

export default reducer;
