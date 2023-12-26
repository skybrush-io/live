/**
 * @file Redux slice for handling the part of the state object that
 * stores the state of the global prompt dialog that we (re)use for
 * single-line inputs (instead of `window.prompt`).
 */

import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import { PromptDialogType, type PromptOptions } from './types';

export type PromptSliceState = ReadonlyDeep<
  PromptOptions & {
    dialogVisible: boolean;
  }
>;

const defaultOptions: PromptOptions = {
  cancelButtonLabel: 'Cancel',
  fieldType: 'text',
  hintText: undefined,
  initialValue: undefined,
  message: undefined,
  submitButtonLabel: 'Submit',
  title: undefined,
  type: PromptDialogType.PROMPT,
};

const initialState: PromptSliceState = {
  ...defaultOptions,
  dialogVisible: false,
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
    _showPromptDialog: {
      reducer: (_state, action: PayloadAction<Partial<PromptOptions>>) =>
        // Nothing is kept from the previous state; this is intentional
        ({
          ...defaultOptions,
          ...action.payload,
          dialogVisible: true,
        }),
      prepare: (message: string, options: string | Partial<PromptOptions>) => ({
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

export const { _cancelPromptDialog, _showPromptDialog, _submitPromptDialog } =
  actions;

export default reducer;
