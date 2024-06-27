/**
 * @file Slice of the state object that stores firmware update related state.
 */

import { createSlice } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import { noPayload } from '~/utils/redux';

type FirmwareUpdateSliceState = ReadonlyDeep<{ dialog: { open: boolean } }>;

const initialState: FirmwareUpdateSliceState = { dialog: { open: false } };

const { actions, reducer } = createSlice({
  name: 'firmware-update',
  initialState,
  reducers: {
    hideFirmwareUpdateSetupDialog: noPayload<FirmwareUpdateSliceState>(
      (state) => {
        state.dialog.open = false;
      }
    ),

    showFirmwareUpdateSetupDialog: noPayload<FirmwareUpdateSliceState>(
      (state) => {
        state.dialog.open = true;
      }
    ),
  },
});

export const { hideFirmwareUpdateSetupDialog, showFirmwareUpdateSetupDialog } =
  actions;

export default reducer;
