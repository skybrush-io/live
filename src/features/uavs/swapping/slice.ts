import { createSlice } from '@reduxjs/toolkit';

type SwapDronesDialogSliceState = {
  open: boolean;
  openUploadDialogAfterSwap: boolean;
};

const initialState: SwapDronesDialogSliceState = {
  open: false,
  openUploadDialogAfterSwap: false,
};

const { actions, reducer } = createSlice({
  name: 'swap-drones',
  initialState,
  reducers: {
    closeSwapDronesDialog: (state) => {
      state.open = false;
    },

    setOpenUploadAfterSwap: (state, action) => {
      state.openUploadDialogAfterSwap = action.payload;
    },

    showSwapDronesDialog: (state) => {
      state.open = true;
    },
  },
});

export const {
  closeSwapDronesDialog,
  setOpenUploadAfterSwap,
  showSwapDronesDialog,
} = actions;

export default reducer;
