/**
 * @file State slice for the sidebar component at the left edge of the
 * app window.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

type SidebarSliceState = ReadonlyDeep<{
  open: boolean;
}>;

const initialState: SidebarSliceState = {
  open: false,
};

const { actions, reducer } = createSlice({
  name: 'sidebar',
  initialState,
  reducers: {
    setSidebarOpen(state, action: PayloadAction<boolean>) {
      state.open = action.payload;
    },
  },
});

export const { setSidebarOpen } = actions;

export default reducer;
