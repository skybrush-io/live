/**
 * @file Slice of the state object that stores the status of the license
 * information dialog.
 */

import { createSlice } from '@reduxjs/toolkit';

import { noPayload } from '~/utils/redux';

const { actions, reducer } = createSlice({
  name: 'licenseInfo',

  initialState: {
    dialog: {
      open: false,
    },
  },

  reducers: {
    closeLicenseInfoDialog: noPayload((state) => {
      state.dialog.open = false;
    }),

    showLicenseInfoDialog: noPayload((state) => {
      state.dialog.open = true;
    }),
  },
});

export const { closeLicenseInfoDialog, showLicenseInfoDialog } = actions;

export default reducer;
