import { getRunningUploadJobType } from '~/features/upload/selectors';
import { openUploadDialogKeepingCurrentJob } from '~/features/upload/slice';
import messageHub from '~/message-hub';
import type { AppThunk } from '~/store/reducers';
import type { Identifier } from '~/utils/collections';

import { JOB_TYPE } from './constants';
import {
  showFirmwareUpdateSetupDialog,
  updateSupportingObjectIdsForTargetId,
} from './slice';

/**
 * Shows the upload dialog if a firmware upload is in progress,
 * otherwise shows the firmware update setup dialog.
 */
export const showFirmwareUpdateDialog =
  (): AppThunk => (dispatch, getState) => {
    if (getRunningUploadJobType(getState()) === JOB_TYPE) {
      dispatch(
        openUploadDialogKeepingCurrentJob({
          backAction: showFirmwareUpdateSetupDialog(),
        })
      );
    } else {
      dispatch(showFirmwareUpdateSetupDialog());
    }
  };

export const fetchSupportingObjectIdsForTargetId =
  (targetId: Identifier): AppThunk<Promise<void>> =>
  async (dispatch) => {
    dispatch(
      updateSupportingObjectIdsForTargetId(
        targetId,
        await messageHub.query.getFirmwareUpdateObjects({
          supports: [targetId],
        })
      )
    );
  };
