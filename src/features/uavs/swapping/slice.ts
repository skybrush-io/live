import { createSlice } from '@reduxjs/toolkit';

type SwapDronesDialogSliceState = {
  open: boolean;
};

const initialState: SwapDronesDialogSliceState = {
  open: false,
};

const { actions, reducer } = createSlice({
  name: 'swap-drones',
  initialState,
  reducers: {
    closeSwapDronesDialog: (state) => {
      state.open = false;
    },

    showSwapDronesDialog: (state) => {
      state.open = true;
    },
  },
});

export const { closeSwapDronesDialog, showSwapDronesDialog } = actions;

export default reducer;
