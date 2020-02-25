/**
 * @file Slice of the state object that stores the state of the 3D view.
 */

import { createSlice } from '@reduxjs/toolkit';

const { actions, reducer } = createSlice({
  name: 'threeD',

  initialState: {
    camera: {
      position: null,
      rotation: null
    },

    navigation: {
      mode: 'walk',
      parameters: {}
    },

    tooltip: null
  },

  reducers: {
    setCameraPose(state, action) {
      const { position, rotation } = action.payload;
      state.camera.position = position;
      state.camera.rotation = rotation;
    },

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

export const {
  hideTooltip,
  setCameraPose,
  setNavigationMode,
  showTooltip
} = actions;

export default reducer;
