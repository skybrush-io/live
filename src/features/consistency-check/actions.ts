import delay from 'delay';

import { showErrorMessage } from '~/features/error-handling/slice';
import { getRunningUploadJobType } from '~/features/upload/selectors';
import {
  openUploadDialogForJob,
  openUploadDialogKeepingCurrentJob,
} from '~/features/upload/slice';
import type { AppThunk } from '~/store/reducers';

import { CONSISTENCY_CHECK_JOB_TYPE } from './constants';
import { parseParameterNames } from './formatting';
import { getConsistencyCheckJobPayload } from './selectors';
import {
  closeConsistencyCheckSetupDialog,
  setConsistencyCheckParameterNames,
  showConsistencyCheckSetupDialog,
} from './slice';

export function proceedToConsistencyCheck(): AppThunk<Promise<void>> {
  return async (dispatch, getState) => {
    const payload = getConsistencyCheckJobPayload(getState());
    dispatch(closeConsistencyCheckSetupDialog());
    await delay(150);
    dispatch(
      openUploadDialogForJob({
        job: { type: CONSISTENCY_CHECK_JOB_TYPE, payload },
        options: { backAction: showConsistencyCheckSetupDialog() },
      })
    );
  };
}

/**
 * Shows the upload dialog if a consistency-check upload is in progress,
 * otherwise shows the consistency-check setup dialog.
 */
export function showConsistencyCheckDialog(): AppThunk {
  return (dispatch, getState) => {
    const isUploadingConsistencyCheck =
      getRunningUploadJobType(getState()) === CONSISTENCY_CHECK_JOB_TYPE;
    if (isUploadingConsistencyCheck) {
      dispatch(
        openUploadDialogKeepingCurrentJob({
          backAction: showConsistencyCheckSetupDialog(),
        })
      );
    } else {
      dispatch(showConsistencyCheckSetupDialog());
    }
  };
}

const MAX_FILE_SIZE_KB = 128;

/**
 * Imports parameter names from a text file (one name per line) into the
 * consistency-check list.
 */
export function importConsistencyCheckNamesFromFile(
  file?: File
): AppThunk<Promise<void>> {
  return async (dispatch) => {
    if (!file) {
      return;
    }

    if (file.size > MAX_FILE_SIZE_KB * 1024) {
      dispatch(
        showErrorMessage(
          `File too large; maximum allowed size is ${MAX_FILE_SIZE_KB} KB`
        )
      );
      return;
    }

    let parsed: string[] | undefined;

    try {
      const contents = await file.text();
      parsed = parseParameterNames(contents);
    } catch (error) {
      dispatch(
        showErrorMessage(
          'Error while parsing parameter names from file',
          error instanceof Error ? error : undefined
        )
      );
    }

    if (parsed && parsed.length > 0) {
      dispatch(setConsistencyCheckParameterNames(parsed));
    }
  };
}
