import { isNil } from 'lodash-es';
import PropTypes from 'prop-types';
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

const UploadDialog = ({
  canGoBack,
  canStartUpload,
  onClose,
  onStartUpload,
  onStepBack,
  open,
  runningJobType,
  selectedJobType,
}) => {
  const isRunningJobTypeMatching =
    !runningJobType || runningJobType === selectedJobType;
  return (
    <DraggableDialog
      fullWidth
      open={Boolean(open)}
      maxWidth='sm'
      title={getDialogTitleForJobType(selectedJobType)}
      onClose={onClose}
    >
      {selectedJobType === FIRMWARE_UPDATE_JOB_TYPE && (
        <FirmwareUpdateSupportFetcher />
      )}
      {isRunningJobTypeMatching ? (
        <UploadPanel
          jobType={selectedJobType}
          onStepBack={canGoBack ? onStepBack : null}
          onStartUpload={canStartUpload ? onStartUpload : null}
        />
      ) : (
        <Box height={240}>
          <AnotherJobTypeRunningHint type={runningJobType} />
        </Box>
      )}
    </DraggableDialog>
  );
};

UploadDialog.propTypes = {
  canGoBack: PropTypes.bool,
  canStartUpload: PropTypes.bool,
  onClose: PropTypes.func,
  onStartUpload: PropTypes.func,
  onStepBack: PropTypes.func,
  open: PropTypes.bool,
  runningJobType: PropTypes.string,
  selectedJobType: PropTypes.string,
};

export default connect(
  // mapStateToProps
  (state) => {
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
