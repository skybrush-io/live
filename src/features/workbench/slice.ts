/**
 * @file State slice for mirroring the current workbench layout.
 */

import { type IWorkbenchState, type Workbench } from 'react-flexible-workbench';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

type WorkbenchSliceState = ReadonlyDeep<{
  /** Stores whether the panel headers are hidden on the workbench */
  hideHeaders: boolean;

  /** Stores whether the current workbench layout is fixed */
  isFixed: boolean;

  /**
   * Default workbench state is in src/workbench.js because the
   * Redux store only 'follows' the workbench state, it does not
   * define it in the usual sense (due to limitations in how
   * golden-layout works)
   */
  state?: IWorkbenchState;
}>;

const initialState: WorkbenchSliceState = {
  hideHeaders: false,
  isFixed: false,
  state: undefined,
};

const { actions, reducer } = createSlice({
  name: 'workbench',
  initialState,
  reducers: {
    setWorkbenchHasHeaders(
      state,
      { payload: hasHeaders }: PayloadAction<boolean>
    ) {
      state.hideHeaders = !(hasHeaders ?? true);
    },

    setWorkbenchIsFixed(state, { payload: isFixed }: PayloadAction<boolean>) {
      state.isFixed = isFixed ?? false;
    },

    saveWorkbenchState: {
      prepare(workbench: Workbench) {
        return {
          payload: workbench.getState(),
        };
      },

      reducer(state, action: PayloadAction<IWorkbenchState>) {
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
