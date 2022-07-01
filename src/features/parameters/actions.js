import delay from 'delay';

import { showErrorMessage } from '~/features/error-handling/actions';
import { getRunningUploadJobType } from '~/features/upload/selectors';
import {
  openUploadDialogForJob,
  openUploadDialogKeepingCurrentJob,
} from '~/features/upload/slice';

import { JOB_TYPE } from './constants';
import { parseParameters } from './formatting';
import { getParameterUploadJobPayloadFromManifest } from './selectors';
import {
  closeParameterUploadSetupDialog,
  showParameterUploadSetupDialog,
  updateParametersInManifest,
} from './slice';

export function proceedToUpload() {
  return async (dispatch, getState) => {
    const payload = getParameterUploadJobPayloadFromManifest(getState());
    dispatch(closeParameterUploadSetupDialog());
    await delay(150);
    dispatch(
      openUploadDialogForJob({
        job: { type: JOB_TYPE, payload },
        options: { backAction: showParameterUploadSetupDialog() },
      })
    );
  };
}

/**
 * Shows the upload dialog if a parameter upload is in progress, otherwise
 * shows the parameter upload setup dialog.
 */
export function showParameterUploadDialog() {
  return (dispatch, getState) => {
    const isUploadingParameters =
      getRunningUploadJobType(getState()) === JOB_TYPE;
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
export function importParametersFromFile(file) {
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

    let parsed;

    try {
      const contents = await file.text();
      parsed = parseParameters(contents);
    } catch (error) {
      dispatch(
        showErrorMessage('Error while parsing parameters from file', error)
      );
    }

    if (Array.isArray(parsed) && parsed.length > 0) {
      dispatch(updateParametersInManifest(parsed));
    }
  };
}
