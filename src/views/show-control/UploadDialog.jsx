import React from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Box from '@material-ui/core/Box';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import { getUAVIdsParticipatingInMissionSortedByMissionIndex } from '~/features/mission/selectors';
import { getNumberOfDronesInShow } from '~/features/show/selectors';
import { startUploadJobWithUavIdsFromSelector } from '~/features/upload/actions';
import {
  getRunningUploadJobType,
  getUploadDialogState,
} from '~/features/upload/selectors';
import { closeUploadDialog } from '~/features/upload/slice';
import AnotherJobTypeRunningHint from '~/features/upload/AnotherJobTypeRunningHint';
import UploadPanel from '~/features/upload/UploadPanel';

const hasAtLeastOneDroneInShow = (state) => getNumberOfDronesInShow(state) > 0;

const SHOW_UPLOAD_JOB = {
  type: 'show-upload',
};

const UploadDialog = () => {
  const { open = false } = useSelector(getUploadDialogState);
  const canStartUpload = useSelector(hasAtLeastOneDroneInShow);
  const runningJobType = useSelector(getRunningUploadJobType);
  const isRunningJobTypeMatching =
    !runningJobType || runningJobType === SHOW_UPLOAD_JOB.type;
  const dispatch = useDispatch();
  return (
    <DraggableDialog
      fullWidth
      open={open}
      maxWidth='sm'
      title='Upload show data'
      onClose={() => {
        dispatch(closeUploadDialog());
      }}
    >
      {isRunningJobTypeMatching ? (
        <UploadPanel
          onStartUpload={
            canStartUpload
              ? () => {
                  dispatch(
                    startUploadJobWithUavIdsFromSelector(
                      SHOW_UPLOAD_JOB,
                      getUAVIdsParticipatingInMissionSortedByMissionIndex
                    )
                  );
                }
              : null
          }
        />
      ) : (
        <Box height={240}>
          <AnotherJobTypeRunningHint type={runningJobType} />
        </Box>
      )}
    </DraggableDialog>
  );
};

export default UploadDialog;
