import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import { startUploadJobFromUploadDialog } from './actions';
import { getDialogTitleForJobType } from './jobs';
import {
  getRunningUploadJobType,
  getSelectedJobInUploadDialog,
  getUploadDialogState,
} from './selectors';
import { closeUploadDialog } from './slice';
import AnotherJobTypeRunningHint from './AnotherJobTypeRunningHint';
import UploadPanel from './UploadPanel';

const UploadDialog = ({
  canStartUpload,
  onClose,
  onStartUpload,
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
      {isRunningJobTypeMatching ? (
        <UploadPanel
          jobType={selectedJobType}
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
  canStartUpload: PropTypes.bool,
  onClose: PropTypes.func,
  onStartUpload: PropTypes.func,
  open: PropTypes.bool,
  runningJobType: PropTypes.string,
  selectedJobType: PropTypes.string,
};

export default connect(
  // mapStateToProps
  (state) => ({
    ...getUploadDialogState(state),
    canStartUpload: true,
    runningJobType: getRunningUploadJobType(state),
    selectedJobType: getSelectedJobInUploadDialog(state)?.type,
  }),
  // mapDispatchToProps
  {
    onClose: closeUploadDialog,
    onStartUpload: startUploadJobFromUploadDialog,
  }
)(UploadDialog);
