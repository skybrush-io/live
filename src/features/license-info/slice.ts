/**
 * @file Slice of the state object that stores the status of the license
 * information dialog.
 */

import { createSlice } from '@reduxjs/toolkit';

import { noPayload } from '~/utils/redux';

type LicenseInfoSliceState = {
  dialog: {
    open: boolean;
  };
};

const initialState: LicenseInfoSliceState = {
  dialog: {
    open: false,
  },
};

const { actions, reducer } = createSlice({
  name: 'license-info',
  initialState,
  reducers: {
    closeLicenseInfoDialog: noPayload<LicenseInfoSliceState>((state) => {
      state.dialog.open = false;
    }),

    showLicenseInfoDialog: noPayload<LicenseInfoSliceState>((state) => {
      state.dialog.open = true;
    }),
  },
});

export const { closeLicenseInfoDialog, showLicenseInfoDialog } = actions;

export default reducer;
