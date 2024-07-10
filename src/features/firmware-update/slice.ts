/**
 * @file Slice of the state object that stores firmware update related state.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { type Identifier } from '~/utils/collections';
import { noPayload } from '~/utils/redux';

type FirmwareUpdateSliceState = {
  dialog: { open: boolean };
  supportingObjectIdsByTargetIds: Record<Identifier, Identifier[]>;
};

const initialState: FirmwareUpdateSliceState = {
  dialog: { open: false },
  supportingObjectIdsByTargetIds: {},
};

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

    updateSupportingObjectIdsForTargetId: {
      prepare: (targetId: Identifier, objectIds: Identifier[]) => ({
        payload: { targetId, objectIds },
      }),
      reducer(
        state,
        {
          payload: { targetId, objectIds },
        }: PayloadAction<{ targetId: Identifier; objectIds: Identifier[] }>
      ) {
        state.supportingObjectIdsByTargetIds[targetId] = objectIds;
      },
    },
  },
});

export const {
  hideFirmwareUpdateSetupDialog,
  showFirmwareUpdateSetupDialog,
  updateSupportingObjectIdsForTargetId,
} = actions;

export default reducer;
