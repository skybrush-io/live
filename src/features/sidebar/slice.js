/**
 * @file State slice for the sidebar component at the left edge of the
 * app window.
 */

import { createSlice } from '@reduxjs/toolkit';

const { actions, reducer } = createSlice({
  name: 'sidebar',

  initialState: {
    open: false
  },

  reducers: {
    toggleSidebar(state) {
      state.open = !state.open;
    }
  }
});

export const { toggleSidebar } = actions;

export default reducer;
