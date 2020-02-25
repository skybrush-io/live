/**
 * @file Slice of the state object that stores the state of the 3D view.
 */

import { createSlice } from '@reduxjs/toolkit';

const { actions, reducer } = createSlice({
  name: 'threeD',

  initialState: {
    navigation: {
      mode: 'walk',
      parameters: {}
    },

    tooltip: null
  },

  reducers: {
    setNavigationMode(state, action) {
      const { payload } = action;

      if (typeof payload === 'string') {
        state.navigation.mode = payload;
        state.navigation.parameters = {};
      } else {
        const { mode, parameters } = payload;

        if (typeof mode === 'string' && typeof parameters === 'object') {
          state.navigation.mode = mode;
          state.navigation.parameters = parameters;
        }
      }
    },

    showTooltip(state, action) {
      state.tooltip = action.payload ? String(action.payload) : null;
    },

    hideTooltip(state) {
      state.tooltip = null;
    }
  }
});

export const { hideTooltip, setNavigationMode, showTooltip } = actions;

export default reducer;
