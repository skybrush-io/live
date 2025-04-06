import isNil from 'lodash-es/isNil';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import { JOB_TYPE as FIRMWARE_UPDATE_JOB_TYPE } from '~/features/firmware-update/constants';
import FirmwareUpdateSupportFetcher from '~/features/firmware-update/FirmwareUpdateSupportFetcher';

import {
  closeUploadDialogAndStepBack,
  startUploadJobFromUploadDialog,
} from './actions';
import AnotherJobTypeRunningHint from './AnotherJobTypeRunningHint';
import { getDialogTitleForJobType } from './jobs';
import {
  getRunningUploadJobType,
  getSelectedJobInUploadDialog,
  getUploadDialogState,
} from './selectors';
import { closeUploadDialog } from './slice';
import UploadPanel from './UploadPanel';
import type { RootState } from '~/store/reducers';

type UploadDialogProps = Readonly<{
  canGoBack: boolean;
  canStartUpload: boolean;
  onClose: () => void;
  onStartUpload: () => void;
  onStepBack: () => void;
  open: boolean;
  runningJobType?: string;
  selectedJobType?: string;
}>;

const UploadDialog = ({
  canGoBack,
  canStartUpload,
  onClose,
  onStartUpload,
  onStepBack,
  open,
  runningJobType,
  selectedJobType,
}: UploadDialogProps): JSX.Element => {
  const isRunningJobTypeMatching =
    !runningJobType || runningJobType === selectedJobType;
  return (
    <DraggableDialog
      fullWidth
      open={Boolean(open)}
      maxWidth='md'
      title={getDialogTitleForJobType(selectedJobType ?? '')}
      onClose={onClose}
    >
      {selectedJobType === FIRMWARE_UPDATE_JOB_TYPE && (
        <FirmwareUpdateSupportFetcher />
      )}
      {isRunningJobTypeMatching ? (
        <UploadPanel
          jobType={selectedJobType ?? ''}
          onStepBack={canGoBack ? onStepBack : undefined}
          onStartUpload={canStartUpload ? onStartUpload : undefined}
        />
      ) : (
        <Box height={240}>
          <AnotherJobTypeRunningHint type={runningJobType} />
        </Box>
      )}
    </DraggableDialog>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => {
    const { open, backAction } = getUploadDialogState(state);
    return {
      open,
      canGoBack: !isNil(backAction),
      canStartUpload: true,
      runningJobType: getRunningUploadJobType(state),
      selectedJobType: getSelectedJobInUploadDialog(state)?.type,
    };
  },
  // mapDispatchToProps
  {
    onClose: closeUploadDialog,
    onStartUpload: startUploadJobFromUploadDialog,
    onStepBack: closeUploadDialogAndStepBack,
  }
)(UploadDialog);
