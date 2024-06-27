import { getRunningUploadJobType } from '~/features/upload/selectors';
import { openUploadDialogKeepingCurrentJob } from '~/features/upload/slice';

import { JOB_TYPE } from './constants';
import { showFirmwareUpdateSetupDialog } from './slice';

/**
 * Shows the upload dialog if a firmware upload is in progress,
 * otherwise shows the firmware update setup dialog.
 */
export const showFirmwareUpdateDialog = () => (dispatch, getState) =>
  dispatch(
    getRunningUploadJobType(getState()) === JOB_TYPE
      ? openUploadDialogKeepingCurrentJob({
          backAction: showFirmwareUpdateSetupDialog(),
        })
      : dispatch(showFirmwareUpdateSetupDialog())
  );
