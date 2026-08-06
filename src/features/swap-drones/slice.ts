import { createSlice } from '@reduxjs/toolkit';

import { noPayload } from '~/utils/redux';

type SwapDronesSliceState = {
  dialog: {
    open: boolean;
  };
};

const initialState: SwapDronesSliceState = {
  dialog: {
    open: false,
  },
};

const { actions, reducer } = createSlice({
  name: 'swap-drones',
  initialState,
  reducers: {
    closeSwapDronesDialog: noPayload<SwapDronesSliceState>((state) => {
      state.dialog.open = false;
    }),

    showSwapDronesDialog: noPayload<SwapDronesSliceState>((state) => {
      state.dialog.open = true;
    }),
  },
});

export const { closeSwapDronesDialog, showSwapDronesDialog } = actions;

export default reducer;
