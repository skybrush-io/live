/**
 * @file State slice for mirroring the current workbench layout.
 */

import { createSlice } from '@reduxjs/toolkit';

const { actions, reducer } = createSlice({
  name: 'workbench',

  initialState: {
    // Default workbench state is in src/workbench.js because the
    // Redux store only 'follows' the workbench state, it does not
    // define it in the usual sense (due to limitations in how
    // golden-layout works)
    state: undefined
  },

  reducers: {
    saveWorkbenchState: {
      prepare(workbench) {
        return {
          payload: workbench.getState()
        };
      },

      reducer(state, action) {
        state.state = action.payload;
      }
    }
  }
});

export const { saveWorkbenchState } = actions;

export default reducer;
