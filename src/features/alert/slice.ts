/**
 * @file Slice of the state object that stores whether the user has pending
 * audible alerts to acknowledge and whether alerts are muted.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

type AlertSliceState = ReadonlyDeep<{
  muted: boolean;
  count: number;
}>;

const initialState: AlertSliceState = {
  muted: false,
  count: 0,
};

const { actions, reducer } = createSlice({
  name: 'alert',
  initialState,
  reducers: {
    dismissAlerts(state) {
      state.count = 0;
    },

    setMuted(state, action: PayloadAction<boolean>) {
      state.muted = action.payload;
    },

    triggerAlert(state) {
      state.count += 1;
    },
  },
});

export const { dismissAlerts, setMuted, triggerAlert } = actions;

export default reducer;
