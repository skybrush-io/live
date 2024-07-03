/**
 * @file Slice of the state object that handles the state of the UAV details
 * dialog.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { setSelection } from '~/features/map/selection';
import { globalIdToUavId, isUavId } from '~/model/identifiers';
import { type AppSelector } from '~/store/reducers';
import { type Coordinate2DObject } from '~/utils/math';
import { noPayload } from '~/utils/redux';

import { UAV_DETAILS_DIALOG_MIN_WIDTH } from './constants';
import { type StoredUAV, UAVDetailsDialogTab } from './types';

type UAVDetailsSliceState = {
  open: boolean;
  selectedUAVId?: StoredUAV['id'];
  selectedTab: UAVDetailsDialogTab;
  position: Coordinate2DObject;
  width: number;
};

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

export const isUAVDetailsDialogOpen: AppSelector<boolean> = (state) =>
  state.dialogs.uavDetails.open;

export const getSelectedUAVIdInUAVDetailsDialog: AppSelector<
  string | undefined
> = (state) => state.dialogs.uavDetails.selectedUAVId;

export const getSelectedTabInUAVDetailsDialog: AppSelector<
  UAVDetailsDialogTab
> = (state) => state.dialogs.uavDetails.selectedTab;

export const getUAVDetailsDialogPosition: AppSelector<Coordinate2DObject> = (
  state
) => state.dialogs.uavDetails.position;

export const getUAVDetailsDialogWidth: AppSelector<number> = (state) =>
  state.dialogs.uavDetails.width;

export default reducer;
