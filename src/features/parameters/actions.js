import delay from 'delay';

import { openUploadDialogWithTaskType } from '~/features/upload/slice';

import { JOB_TYPE } from './constants';
import { closeParameterUploadSetupDialog } from './slice';

export function proceedToUpload() {
  return async (dispatch) => {
    dispatch(closeParameterUploadSetupDialog());
    await delay(150);
    dispatch(openUploadDialogWithTaskType(JOB_TYPE));
  };
}
