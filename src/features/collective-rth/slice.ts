import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type StatEntry = {
  /**
   * Start time of the collective RTH plan relative to show start, in seconds.
   */
  time: number;

  /**
   * The duration of the collective RTH operation, without landing, in seconds.
   */
  duration: number;

  /**
   * Total show duration including collective RTH and landing, in seconds.
   */
  show_duration: number;
};

export type TransformationResult = {
  /**
   * The transformed show as a base64-encoded string.
   */
  show: string;

  /**
   * The full duration of the show in seconds, stored for convenience.
   */
  showDuration: number;

  /**
   * Statistics about the collective RTH operation.
   */
  stats: StatEntry[];

  /**
   * The last timestamp at which a collective RTH plan was generated, in seconds.
   */
  firstTime: number;

  /**
   * The last timestamp at which a collective RTH plan was generated, in seconds.
   */
  lastTime: number;
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
