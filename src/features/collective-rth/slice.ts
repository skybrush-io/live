import { createSlice } from '@reduxjs/toolkit';

export type CollectiveRTHDialogState = {
  open: boolean;
};

const initialState: CollectiveRTHDialogState = {
  open: false,
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
     * Closes the dialog and completely resets its state.
     */
    closeDialog() {
      return initialState;
    },
  },
});

export const { closeDialog, showDialog } = actions;

export default reducer;
