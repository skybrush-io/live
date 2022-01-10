import delay from 'delay';

import { openUploadDialogForJob } from '~/features/upload/slice';

import { JOB_TYPE } from './constants';
import { getParameterUploadJobPayloadFromManifest } from './selectors';
import { closeParameterUploadSetupDialog } from './slice';

export function proceedToUpload() {
  return async (dispatch, getState) => {
    const payload = getParameterUploadJobPayloadFromManifest(getState());
    dispatch(closeParameterUploadSetupDialog());
    await delay(150);
    dispatch(openUploadDialogForJob({ type: JOB_TYPE, payload }));
  };
}
