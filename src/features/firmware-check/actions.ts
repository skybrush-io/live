import { getRunningUploadJobType } from '~/features/upload/selectors';
import {
  openUploadDialogForJob,
  openUploadDialogKeepingCurrentJob,
} from '~/features/upload/slice';
import type { AppThunk } from '~/store/reducers';

import { FIRMWARE_CHECK_JOB_TYPE } from './constants';

/**
 * Shows the upload dialog with a new firmware check job, or keeps the
 * current job visible if a firmware check is already in progress.
 */
export const showFirmwareCheckDialog = (): AppThunk => (dispatch, getState) => {
  if (getRunningUploadJobType(getState()) === FIRMWARE_CHECK_JOB_TYPE) {
    dispatch(openUploadDialogKeepingCurrentJob());
  } else {
    dispatch(
      openUploadDialogForJob({
        job: { type: FIRMWARE_CHECK_JOB_TYPE },
      })
    );
  }
};
