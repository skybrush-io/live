import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import type { CollectiveRTHParameters } from '~/flockwave/types';

import { COLLECTIVE_RTH_DEFAULTS } from './constants';

export type CollectiveRTHDialogState = {
  open: boolean;

  /**
   * The default parameters of a collective RTH plan calculation. Persisted
   * between application restarts and updated when the user starts a
   * calculation with explicitly given parameters.
   */
  parameters: CollectiveRTHParameters;
};

const initialState: CollectiveRTHDialogState = {
  open: false,
  parameters: COLLECTIVE_RTH_DEFAULTS,
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
    setParameters(state, action: PayloadAction<CollectiveRTHParameters>) {
      state.parameters = action.payload;
    },
  },
});

export const { closeDialog, setParameters, showDialog } = actions;

export default reducer;
