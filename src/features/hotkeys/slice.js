/**
 * @file Slice of the state object that stores the state of the LCD clock panel.
 */

import { createSlice } from '@reduxjs/toolkit';

import { noPayload } from '~/utils/redux';

const { actions, reducer } = createSlice({
  name: 'hotkeys',

  initialState: {
    dialogVisible: false,
  },

  reducers: {
    showHotkeyDialog: noPayload((state) => {
      state.dialogVisible = true;
    }),

    closeHotkeyDialog: noPayload((state) => {
      state.dialogVisible = false;
    }),
  },
});

export const { closeHotkeyDialog, showHotkeyDialog } = actions;

export default reducer;
