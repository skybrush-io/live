/**
 * @file Generic thunk factories for setup dialogs that eventually lead to the
 * upload dialog.
 */

import type { Action } from '@reduxjs/toolkit';
import delay from 'delay';

import { showErrorMessage } from '~/features/error-handling/slice';
import { getRunningUploadJobType } from '~/features/upload/selectors';
import {
  openUploadDialogForJob,
  openUploadDialogKeepingCurrentJob,
} from '~/features/upload/slice';
import type { AppSelector, AppThunk } from '~/store/reducers';

/** Delay between closing the setup dialog and opening the upload dialog. */
const SETUP_DIALOG_TRANSITION_DELAY = 150;

/**
 * Creates a thunk that closes the setup dialog and opens the
 * upload dialog for the given job type, passing the result of `getPayload` as
 * the job payload and `showDialog()` as the upload dialog's back action.
 */
export function createProceedToUploadDialogThunk<TPayload>(
  jobType: string,
  getPayload: AppSelector<TPayload>,
  closeDialog: () => Action,
  showDialog: () => Action
): () => AppThunk<Promise<void>> {
  return () => async (dispatch, getState) => {
    const payload = getPayload(getState());
    dispatch(closeDialog());
    await delay(SETUP_DIALOG_TRANSITION_DELAY);
    dispatch(
      openUploadDialogForJob({
        job: { type: jobType, payload },
        options: { backAction: showDialog() },
      })
    );
  };
}

/**
 * Creates a thunk that opens the upload dialog (keeping the current job) if a
 * job of the given type is already running, otherwise opens the setup dialog.
 */
export function createShowSetupDialogThunk(
  jobType: string,
  showDialog: () => Action
): () => AppThunk {
  return () => (dispatch, getState) => {
    if (getRunningUploadJobType(getState()) === jobType) {
      dispatch(openUploadDialogKeepingCurrentJob({ backAction: showDialog() }));
    } else {
      dispatch(showDialog());
    }
  };
}

const MAX_IMPORT_FILE_SIZE_KB = 128;

/**
 * Creates a thunk that imports parsed items from a text file. Large files are
 * rejected; parse errors trigger an error dialog. `applyParsed` is called on
 * success with the parsed items.
 */
export function createFileImportFromFileThunk<T>(
  parse: (input: string) => T[],
  applyParsed: (parsed: T[]) => Action,
  errorMessage: string
): (file?: File) => AppThunk<Promise<void>> {
  return (file) => async (dispatch) => {
    if (!file) {
      return;
    }

    if (file.size > MAX_IMPORT_FILE_SIZE_KB * 1024) {
      dispatch(
        showErrorMessage(
          `File too large; maximum allowed size is ${MAX_IMPORT_FILE_SIZE_KB} KB`
        )
      );
      return;
    }

    let parsed: T[] | undefined;

    try {
      const contents = await file.text();
      parsed = parse(contents);
    } catch (error) {
      dispatch(
        showErrorMessage(
          errorMessage,
          error instanceof Error ? error : undefined
        )
      );
    }

    if (parsed && parsed.length > 0) {
      dispatch(applyParsed(parsed));
    }
  };
}
