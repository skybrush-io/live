import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';

import type { ResolvedDronePair, ResolvedDronePairWithId } from './types';
import type { SwapFieldSide } from './utils';

type SwapDronesDialogSliceState = {
  /** Text entered into the drone fields of the dialog */
  fields: Record<SwapFieldSide, string>;
  open: boolean;
  openUploadDialogAfterSwap: boolean;
  /** Swaps queued up for execution; kept when the dialog is closed */
  queue: ResolvedDronePairWithId[];
};

const createEmptyFields = (): Record<SwapFieldSide, string> => ({
  left: '',
  right: '',
});

const initialState: SwapDronesDialogSliceState = {
  fields: createEmptyFields(),
  open: false,
  openUploadDialogAfterSwap: false,
  queue: [],
};

const { actions, reducer } = createSlice({
  name: 'swap-drones',
  initialState,
  reducers: {
    addPairToSwapQueue: {
      prepare: (pair: ResolvedDronePair) => ({
        payload: { ...pair, id: nanoid() },
      }),
      reducer: (state, action: PayloadAction<ResolvedDronePairWithId>) => {
        state.queue.push(action.payload);
        state.fields = createEmptyFields();
      },
    },

    clearSwapQueue: (state) => {
      state.queue = [];
    },

    closeSwapDronesDialog: (state) => {
      state.open = false;
    },

    removePairFromSwapQueue: (state, action: PayloadAction<string>) => {
      state.queue = state.queue.filter((pair) => pair.id !== action.payload);
    },

    setOpenUploadAfterSwap: (state, action) => {
      state.openUploadDialogAfterSwap = action.payload;
    },

    setSwapDroneFieldText: (
      state,
      action: PayloadAction<{ side: SwapFieldSide; text: string }>
    ) => {
      state.fields[action.payload.side] = action.payload.text;
    },

    showSwapDronesDialog: (state) => {
      state.open = true;
      state.fields = createEmptyFields();
    },
  },
});

export const {
  addPairToSwapQueue,
  clearSwapQueue,
  closeSwapDronesDialog,
  removePairFromSwapQueue,
  setOpenUploadAfterSwap,
  setSwapDroneFieldText,
  showSwapDronesDialog,
} = actions;

export default reducer;
