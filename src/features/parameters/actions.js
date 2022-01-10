import delay from 'delay';

import { JobType } from '~/features/upload/jobs';
import { openUploadDialogWithTaskType } from '~/features/upload/slice';

import { closeParameterUploadSetupDialog } from './slice';

export function proceedToUpload() {
  return async (dispatch) => {
    dispatch(closeParameterUploadSetupDialog());
    await delay(150);
    dispatch(openUploadDialogWithTaskType(JobType.PARAMETER_UPLOAD));
  };
}
