import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type TransformationResult = {
  /**
   * The transformed show as a base64-encoded string.
   */
  show: string;

  /**
   * The first timestamp at which a collective RTH plan was generated, in seconds.
   */
  firstTime?: number;

  /**
   * The last timestamp at which a collective RTH plan was generated, in seconds.
   */
  lastTime?: number;

  /**
   * The maximum show duration assuming a collective RTH plan got triggered, in seconds.
   */
  maxShowDuration?: number;
};

export type TransformationResultOrStatus =
  | TransformationResult
  | { error: string }
  | { loading: true };

export type CollectiveRTHDialogRTHState = {
  open: boolean;
  result?: TransformationResultOrStatus;
};

const initialState: CollectiveRTHDialogRTHState = {
  open: false,
  result: undefined,
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

    /**
     * Stores the given result in the state.
     *
     * If the action's payload is `undefined`, the result is cleared.
     */
    setResult(
      state,
      action: PayloadAction<TransformationResultOrStatus | undefined>
    ) {
      state.result = action.payload;
    },
  },
});

export const { closeDialog, setResult, showDialog } = actions;

export default reducer;
