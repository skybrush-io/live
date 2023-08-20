/**
 * @file Redux slice for handling the part of the state object that
 * stores the state of the global prompt dialog that we (re)use for
 * single-line inputs (instead of `window.prompt`).
 */

import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { PromptOptions } from './types';

export type PromptSliceState = PromptOptions & {
  dialogVisible: boolean;
};

const initialState: PromptSliceState = {
  cancelButtonLabel: 'Cancel',
  dialogVisible: false,
  fieldType: 'text',
  hintText: undefined,
  initialValue: undefined,
  message: undefined,
  submitButtonLabel: 'Submit',
  title: undefined,
};

/**
 * The reducer that handles actions related to the prompt dialog.
 */
const { reducer, actions } = createSlice({
  name: 'prompt',
  initialState,
  reducers: {
    /**
     * Action that closes the prompt dialog without submitting anything.
     *
     * This is not exported because the thunk version should be used instead.
     */
    _cancelPromptDialog(state) {
      state.dialogVisible = false;
    },

    /**
     * Action that will show the prompt dialog.
     * This is not exported because the thunk version should be used instead.
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _showPromptDialog: {
      reducer: (state, action: PayloadAction<Partial<PromptSliceState>>) =>
        // Nothing is kept from the previous state; this is intentional
        ({
          ...initialState,
          ...action.payload,
          dialogVisible: true,
        }),
      prepare: (
        message: string,
        options: string | Partial<PromptSliceState>
      ) => ({
        payload: {
          ...(typeof options === 'string'
            ? { initialValue: options }
            : options),
          message,
        },
      }),
    },

    /**
     * Action that submits the prompt dialog with the given value.
     *
     * This is not exported because the thunk version should be used instead.
     */
    _submitPromptDialog(state) {
      state.dialogVisible = false;
    },
  },
});

// eslint-disable-next-line @typescript-eslint/naming-convention
export const { _cancelPromptDialog, _showPromptDialog, _submitPromptDialog } =
  actions;

export default reducer;
