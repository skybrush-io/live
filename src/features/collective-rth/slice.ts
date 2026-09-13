import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { CollectiveRTHParameters } from '~/flockwave/types';

import { COLLECTIVE_RTH_DEFAULTS } from './constants';

export type CollectiveRTHDialogState = {
  open: boolean;
  parameters: CollectiveRTHParameters;
  waitingForApproval: boolean;
};

const initialState: CollectiveRTHDialogState = {
  open: false,
  parameters: COLLECTIVE_RTH_DEFAULTS,
  waitingForApproval: false,
};

const { reducer, actions } = createSlice({
  name: 'collective-rth',
  initialState,
  reducers: {
    /**
     * Opens the dialog.
     */
    showDialog(state) {
      state.open = true;
    },

    /**
     * Closes the dialog. The default parameters are deliberately kept as
     * they are persisted between application restarts.
     */
    closeDialog(state) {
      state.open = false;
    },

    /**
     * Stores the given parameters as the new defaults for the next
     * collective RTH plan calculation.
     */
    _setParameters(state, action: PayloadAction<CollectiveRTHParameters>) {
      state.parameters = action.payload;
    },

    _setWaitingForApproval(state, action: PayloadAction<boolean>) {
      state.waitingForApproval = action.payload;
    },
  },
});

export const {
  closeDialog,
  showDialog,
  _setParameters,
  _setWaitingForApproval,
} = actions;

export default reducer;
