/**
 * @file Slice of the state object that stores whether the user has pending
 * audible alerts to acknowledge and whether alerts are muted.
 */

import { createSlice } from '@reduxjs/toolkit';

const { actions, reducer } = createSlice({
  name: 'alert',

  initialState: {
    muted: false,
    count: 0,
  },

  reducers: {
    dismissAlerts(state) {
      state.count = 0;
    },

    setMuted(state, action) {
      state.muted = Boolean(action.payload);
    },

    triggerAlert(state) {
      state.count += 1;
    },
  },
});

export const { dismissAlerts, setMuted, triggerAlert } = actions;

export default reducer;
