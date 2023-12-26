/**
 * @file Slice of the state object that stores the status of an ongoing
 * version check on the connected drones.
 */

import { createSlice } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import { noPayload } from '~/utils/redux';

type VersionCheckSliceState = ReadonlyDeep<{
  dialog: {
    open: boolean;
  };
}>;

const initialState: VersionCheckSliceState = {
  dialog: {
    open: false,
  },
};

const { actions, reducer } = createSlice({
  name: 'version-check',
  initialState,
  reducers: {
    closeVersionCheckDialog: noPayload<VersionCheckSliceState>((state) => {
      state.dialog.open = false;
    }),

    showVersionCheckDialog: noPayload<VersionCheckSliceState>((state) => {
      state.dialog.open = true;
    }),
  },
});

export const { closeVersionCheckDialog, showVersionCheckDialog } = actions;

export default reducer;
