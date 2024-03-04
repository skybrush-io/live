/**
 * @file Action factories related to the global prompt dialog.
 */

import type { ThunkAction } from '@reduxjs/toolkit';

import {
  _cancelPromptDialog,
  _showPromptDialog,
  _submitPromptDialog,
} from './slice';
import {
  PromptDialogType,
  type PromptOptions,
  type PromptResponse,
} from './types';

// TODO: replace this with the real AppDispatch once we have it in store.ts
type AppDispatch = (action: any) => void;
type AppState = any;
type AppThunk<T = void> = ThunkAction<T, AppState, any, any>;

/**
 * Function that must be called from the submission thunk to resolve the
 * promise created earlier in the ``showPromptDialog()`` thunk.
 */
let resolver:
  | ((value: PromptResponse | PromiseLike<PromptResponse>) => void)
  | undefined;

/**
 * Helper function that calls the resolver function with the given value
 * if we have a resolver function, and does nothing otherwise.
 *
 * @param  value  the value to call the resolver with
 */
function resolveTo(value: PromptResponse): void {
  if (resolver !== undefined) {
    resolver(value);
    resolver = undefined;
  }
}

/**
 * Thunk factory that creates a thunk that closes the prompt dialog
 * without submitting anything, and resolves the promise of the prompt
 * dialog to undefined.
 *
 * @returns  {function}  a Redux thunk
 */
export function cancelPromptDialog(): AppThunk {
  return (dispatch: AppDispatch) => {
    dispatch(_cancelPromptDialog());
    resolveTo(undefined);
  };
}

/**
 * Thunk factory that creates a thunk that submits the prompt dialog
 * with the given value.
 */
export function submitPromptDialog(value: PromptResponse): AppThunk {
  if (value === undefined) {
    return cancelPromptDialog();
  }

  return (dispatch) => {
    dispatch(_submitPromptDialog());
    resolveTo(value);
  };
}

/**
 * Thunk factory that creates a thunk that shows the prompt dialog.
 *
 * @param  message  the message to show in the dialog
 * @param  options  additional options to pass to the dialog
 */
export function showPromptDialog(
  options: PromptOptions = {}
): AppThunk<Promise<PromptResponse>> {
  return async (dispatch) => {
    resolveTo(undefined);
    dispatch(_showPromptDialog({ type: PromptDialogType.GENERIC, ...options }));
    return new Promise((resolve) => {
      resolver = resolve;
    });
  };
}

/**
 * Thunk factory that creates a thunk that shows a confirmation dialog.
 *
 * @param  message  the message to show in the dialog
 * @param  options  additional options to pass to the dialog
 */
export function showConfirmationDialog(
  message: string,
  options: Partial<Omit<PromptOptions, 'initialValues' | 'schema'>> = {}
): AppThunk<Promise<PromptResponse>> {
  return async (dispatch) => {
    resolveTo(undefined);
    dispatch(
      _showPromptDialog({
        type: PromptDialogType.CONFIRMATION,
        message,
        ...options,
      })
    );
    return new Promise((resolve) => {
      resolver = resolve;
    });
  };
}
