/**
 * @file State slice for the sidebar component at the left edge of the
 * app window.
 */

import { createSlice } from '@reduxjs/toolkit';

import { noPayload } from '~/utils/redux';

const { actions, reducer } = createSlice({
  name: 'sidebar',

  initialState: {
    open: false,
  },

  reducers: {
    closeSidebar(state) {
      state.open = false;
    },

    openSidebar(state) {
      state.open = true;
    },

    toggleSidebar: noPayload((state) => {
      state.open = !state.open;
    }),
  },
});

export const { closeSidebar, openSidebar, toggleSidebar } = actions;

export default reducer;
