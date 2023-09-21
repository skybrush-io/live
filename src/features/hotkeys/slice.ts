/**
 * @file Slice of the state object that stores the state of the LCD clock panel.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import { noPayload } from '~/utils/redux';

type HotkeysSliceState = ReadonlyDeep<{
  dialogVisible: boolean;
  pendingUAVId: string;
}>;

const initialState: HotkeysSliceState = {
  dialogVisible: false,
  pendingUAVId: '',
};

const { actions, reducer } = createSlice({
  name: 'hotkeys',
  initialState,
  reducers: {
    setPendingUAVId(state, action: PayloadAction<string>) {
      state.pendingUAVId = action.payload;
    },

    startPendingUAVIdTimeout() {
      /* nothing to do here, the saga will take care of it */
    },

    showHotkeyDialog: noPayload<HotkeysSliceState>((state) => {
      state.dialogVisible = true;
    }),

    closeHotkeyDialog: noPayload<HotkeysSliceState>((state) => {
      state.dialogVisible = false;
    }),
  },
});

export const {
  closeHotkeyDialog,
  showHotkeyDialog,
  setPendingUAVId,
  startPendingUAVIdTimeout,
} = actions;

export default reducer;
