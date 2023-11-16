/**
 * @file Redux slice for handling the part of the state object that
 * stores the state of the global prompt dialog that we (re)use for
 * single-line inputs (instead of `window.prompt`).
 */

import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import { PromptDialogType, type PromptOptions } from './types';

export type PromptSliceState = ReadonlyDeep<
  {
    open: boolean;
    type: PromptDialogType;
  } & PromptOptions
>;

const initialState: PromptSliceState = {
  open: false,

  type: PromptDialogType.GENERIC,

  initialValues: {},
  schema: {},

  cancelButtonLabel: undefined,
  message: undefined,
  submitButtonLabel: undefined,
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
      state.open = false;
    },

    /**
     * Action that will show the prompt dialog.
     * This is not exported because the thunk version should be used instead.
     */
    _showPromptDialog(
      state,
      {
        payload,
      }: PayloadAction<Omit<PromptOptions, 'open'> & { type: PromptDialogType }>
    ) {
      state.open = true;
      Object.assign(state, payload);
    },

    /**
     * Action that submits the prompt dialog with the given value.
     *
     * This is not exported because the thunk version should be used instead.
     */
    _submitPromptDialog(state) {
      state.open = false;
    },
  },
});

export const { _cancelPromptDialog, _showPromptDialog, _submitPromptDialog } =
  actions;

export default reducer;
