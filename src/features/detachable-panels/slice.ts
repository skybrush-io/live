/**
 * @file Slice of the state object that stores the status of the detachable
 * panels.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

type DetachedPanelsSliceState = {
  detachedPanels: string[];
};

const initialState: DetachedPanelsSliceState = {
  detachedPanels: [],
};

const { actions, reducer } = createSlice({
  name: 'detachable-panels',
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
