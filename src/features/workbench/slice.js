/**
 * @file State slice for mirroring the current workbench layout.
 */

import { createSlice } from '@reduxjs/toolkit';

const { actions, reducer } = createSlice({
  name: 'workbench',

  initialState: {
    // Stores whether the panel headers are shown on the workbench
    hideHeaders: false,

    // Stores whether the current workbench layout is fixed
    isFixed: false,

    // Default workbench state is in src/workbench.js because the
    // Redux store only 'follows' the workbench state, it does not
    // define it in the usual sense (due to limitations in how
    // golden-layout works)
    state: undefined,
  },

  reducers: {
    setWorkbenchHasHeaders(state, { payload: hasHeaders }) {
      state.hideHeaders = !(hasHeaders ?? true);
    },

    setWorkbenchIsFixed(state, { payload: isFixed }) {
      state.isFixed = isFixed ?? false;
    },

    saveWorkbenchState: {
      prepare(workbench) {
        return {
          payload: workbench.getState(),
        };
      },

      reducer(state, action) {
        state.state = action.payload;
      },
    },
  },
});

export const {
  setWorkbenchIsFixed,
  setWorkbenchHasHeaders,
  saveWorkbenchState,
} = actions;

export default reducer;
