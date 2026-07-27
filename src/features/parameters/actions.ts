import delay from 'delay';

import { showErrorMessage } from '~/features/error-handling/slice';
import { getRunningUploadJobType } from '~/features/upload/selectors';
import {
  openUploadDialogForJob,
  openUploadDialogKeepingCurrentJob,
} from '~/features/upload/slice';
import type { AppThunk } from '~/store/reducers';

import { UPLOAD_JOB_TYPE } from './constants';
import { parseParameters } from './formatting';
import { getParameterUploadJobPayloadFromManifest } from './selectors';
import {
  closeParameterUploadSetupDialog,
  showParameterUploadSetupDialog,
  updateParametersInManifest,
} from './slice';
import type { ParameterData } from './types';

export function proceedToUpload(): AppThunk<Promise<void>> {
  return async (dispatch, getState) => {
    const payload = getParameterUploadJobPayloadFromManifest(getState());
    dispatch(closeParameterUploadSetupDialog());
    await delay(150);
    dispatch(
      openUploadDialogForJob({
        job: { type: UPLOAD_JOB_TYPE, payload },
        options: { backAction: showParameterUploadSetupDialog() },
      })
    );
  };
}

/**
 * Shows the upload dialog if a parameter upload is in progress, otherwise
 * shows the parameter upload setup dialog.
 */
export function showParameterUploadDialog(): AppThunk {
  return (dispatch, getState) => {
    const isUploadingParameters =
      getRunningUploadJobType(getState()) === UPLOAD_JOB_TYPE;
    if (isUploadingParameters) {
      dispatch(
        openUploadDialogKeepingCurrentJob({
          backAction: showParameterUploadSetupDialog(),
        })
      );
    } else {
      dispatch(showParameterUploadSetupDialog());
    }
  };
}

const MAX_FILE_SIZE_KB = 128;

/**
 * Imports a parameter file into the parameter manifest.
 */
export function importParametersFromFile(file?: File): AppThunk<Promise<void>> {
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

    let parsed: ParameterData[] | undefined;

    try {
      const contents = await file.text();
      parsed = parseParameters(contents);
    } catch (error) {
      dispatch(
        showErrorMessage(
          'Error while parsing parameters from file',
          error instanceof Error ? error : undefined
        )
      );
    }

    if (parsed && parsed.length > 0) {
      dispatch(updateParametersInManifest(parsed));
    }
  };
}
