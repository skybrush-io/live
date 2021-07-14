/**
 * @file Slice of the state object that stores the state of the LCD clock panel.
 */

import { createSlice } from '@reduxjs/toolkit';

import { noPayload } from '~/utils/redux';

const { actions, reducer } = createSlice({
  name: 'hotkeys',

  initialState: {
    dialogVisible: false,
    pendingUAVId: '',
  },

  reducers: {
    setPendingUAVId: (state, action) => {
      state.pendingUAVId = action.payload;
    },

    startPendingUAVIdTimeout: () => {
      /* nothing to do here, the saga will take care of it */
    },

    showHotkeyDialog: noPayload((state) => {
      state.dialogVisible = true;
    }),

    closeHotkeyDialog: noPayload((state) => {
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
