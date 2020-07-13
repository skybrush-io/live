/**
 * @file Slice of the state object that stores the status of an ongoing
 * version check on the connected drones.
 */

import { createSlice } from '@reduxjs/toolkit';

import { noPayload } from '~/utils/redux';

const { actions, reducer } = createSlice({
  name: 'version-check',

  initialState: {
    dialog: {
      open: false,
    },
  },

  reducers: {
    closeVersionCheckDialog: noPayload((state) => {
      state.dialog.open = false;
    }),

    showVersionCheckDialog: noPayload((state) => {
      state.dialog.open = true;
    }),
  },
});

export const { closeVersionCheckDialog, showVersionCheckDialog } = actions;

export default reducer;
