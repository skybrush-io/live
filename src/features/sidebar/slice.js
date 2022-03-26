/**
 * @file State slice for the sidebar component at the left edge of the
 * app window.
 */

import { createSlice } from '@reduxjs/toolkit';

const { actions, reducer } = createSlice({
  name: 'sidebar',

  initialState: {
    open: false,
  },

  reducers: {
    setSidebarOpen(state, action) {
      state.open = Boolean(action.payload);
    },
  },
});

export const { setSidebarOpen } = actions;

export default reducer;
