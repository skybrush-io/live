/**
 * @file Slice of the state object that handles the state of the dock details
 * dialog.
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import { noPayload } from '~/utils/redux';

import { DockDetailsDialogTab, type DockState } from './types';

type DockDetailsSliceState = ReadonlyDeep<{
  open: boolean;
  selectedDockId?: DockState['id'];
  selectedTab: DockDetailsDialogTab;
}>;

const initialState: DockDetailsSliceState = {
  open: false,
  selectedDockId: undefined,
  selectedTab: DockDetailsDialogTab.STATUS,
};

const { actions, reducer } = createSlice({
  name: 'dock-details',
  initialState,
  reducers: {
    openDockDetailsDialog(state, { payload }: PayloadAction<DockState['id']>) {
      state.selectedDockId = payload;
      state.open = true;
    },

    closeDockDetailsDialog: noPayload<DockDetailsSliceState>((state) => {
      state.open = false;
    }),

    setSelectedTabInDockDetailsDialog(
      state,
      { payload }: PayloadAction<DockDetailsDialogTab>
    ) {
      state.selectedTab = payload;
    },
  },
});

export const {
  openDockDetailsDialog,
  closeDockDetailsDialog,
  setSelectedTabInDockDetailsDialog,
} = actions;

type RootStateWithDockDetailsDialog = {
  dialogs: { dockDetails: DockDetailsSliceState };
};

export const getSelectedDockIdInDockDetailsDialog = (
  state: RootStateWithDockDetailsDialog
): string | undefined => state.dialogs.dockDetails.selectedDockId;

export const getSelectedTabInDockDetailsDialog = (
  state: RootStateWithDockDetailsDialog
): DockDetailsDialogTab => state.dialogs.dockDetails.selectedTab;

export default reducer;
