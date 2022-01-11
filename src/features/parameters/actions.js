import delay from 'delay';

import { getRunningUploadJobType } from '~/features/upload/selectors';
import {
  openUploadDialogForJob,
  openUploadDialogKeepingCurrentJob,
} from '~/features/upload/slice';

import { JOB_TYPE } from './constants';
import { getParameterUploadJobPayloadFromManifest } from './selectors';
import {
  closeParameterUploadSetupDialog,
  showParameterUploadSetupDialog,
} from './slice';

export function proceedToUpload() {
  return async (dispatch, getState) => {
    const payload = getParameterUploadJobPayloadFromManifest(getState());
    dispatch(closeParameterUploadSetupDialog());
    await delay(150);
    dispatch(openUploadDialogForJob({ type: JOB_TYPE, payload }));
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
      dispatch(openUploadDialogKeepingCurrentJob());
    } else {
      dispatch(showParameterUploadSetupDialog());
    }
  };
}
