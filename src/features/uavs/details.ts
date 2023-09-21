/**
 * @file Slice of the state object that handles the state of the UAV details
 * dialog.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import { setSelection } from '~/features/map/selection';
import { globalIdToUavId, isUavId } from '~/model/identifiers';
import { type Coordinate2DObject } from '~/utils/math';
import { noPayload } from '~/utils/redux';

import { UAV_DETAILS_DIALOG_MIN_WIDTH } from './constants';
import { type StoredUAV, UAVDetailsDialogTab } from './types';

type UAVDetailsSliceState = ReadonlyDeep<{
  open: boolean;
  selectedUAVId?: StoredUAV['id'];
  selectedTab: UAVDetailsDialogTab;
  position: Coordinate2DObject;
  width: number;
}>;

const initialState: UAVDetailsSliceState = {
  open: false,
  selectedUAVId: undefined,
  selectedTab: UAVDetailsDialogTab.PREFLIGHT,
  position: { x: 0, y: 0 },
  width: UAV_DETAILS_DIALOG_MIN_WIDTH,
};

const { actions, reducer } = createSlice({
  name: 'uav-details',
  initialState,
  reducers: {
    openUAVDetailsDialog(state, { payload }: PayloadAction<StoredUAV['id']>) {
      state.selectedUAVId = payload;
      state.open = true;
    },

    closeUAVDetailsDialog: noPayload<UAVDetailsSliceState>((state) => {
      state.open = false;
    }),

    setSelectedTabInUAVDetailsDialog(
      state,
      { payload }: PayloadAction<UAVDetailsDialogTab>
    ) {
      state.selectedTab = payload;
    },

    setSelectedUAVIdInUAVDetailsDialog(
      state,
      { payload }: PayloadAction<StoredUAV['id']>
    ) {
      state.selectedUAVId = payload;
    },

    setUAVDetailsDialogPosition(
      state,
      { payload }: PayloadAction<Coordinate2DObject>
    ) {
      state.position = payload;
    },

    setUAVDetailsDialogWidth(state, { payload }: PayloadAction<number>) {
      state.width = payload;
    },
  },

  extraReducers(builder) {
    builder.addCase(setSelection, (state, { payload: selection }) => {
      const selectedUAV = selection.find(isUavId);
      if (selectedUAV) {
        state.selectedUAVId = globalIdToUavId(selectedUAV);
      }
    });
  },
});

export const {
  openUAVDetailsDialog,
  closeUAVDetailsDialog,
  setSelectedTabInUAVDetailsDialog,
  setSelectedUAVIdInUAVDetailsDialog,
  setUAVDetailsDialogPosition,
  setUAVDetailsDialogWidth,
} = actions;

type RootStateWithUAVDetailsDialog = {
  dialogs: { uavDetails: UAVDetailsSliceState };
};

export const isUAVDetailsDialogOpen = (
  state: RootStateWithUAVDetailsDialog
): boolean => state.dialogs.uavDetails.open;

export const getSelectedUAVIdInUAVDetailsDialog = (
  state: RootStateWithUAVDetailsDialog
): string | undefined => state.dialogs.uavDetails.selectedUAVId;

export const getSelectedTabInUAVDetailsDialog = (
  state: RootStateWithUAVDetailsDialog
): UAVDetailsDialogTab => state.dialogs.uavDetails.selectedTab;

export const getUAVDetailsDialogPosition = (
  state: RootStateWithUAVDetailsDialog
): Coordinate2DObject => state.dialogs.uavDetails.position;

export const getUAVDetailsDialogWidth = (
  state: RootStateWithUAVDetailsDialog
): number => state.dialogs.uavDetails.width;

export default reducer;
