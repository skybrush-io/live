/**
 * @file Slice of the state object that stores the status of the detachable
 * panels.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

type DetachedPanelsSliceState = ReadonlyDeep<{
  detachedPanels: string[];
}>;

const initialState: DetachedPanelsSliceState = {
  detachedPanels: [],
};

const { actions, reducer } = createSlice({
  name: 'detachablePanels',
  initialState,
  reducers: {
    attachPanel(state, { payload: name }: PayloadAction<string>) {
      const index = state.detachedPanels.indexOf(name);
      if (index !== -1) {
        state.detachedPanels.splice(index, 1);
      }
    },

    detachPanel(state, { payload: name }: PayloadAction<string>) {
      state.detachedPanels.push(name);
    },
  },
});

export const { attachPanel, detachPanel } = actions;

export default reducer;
