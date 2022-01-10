import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import { startUploadJobFromUploadDialog } from '~/features/upload/actions';
import { getDialogTitleForJobType } from '~/features/upload/jobs';
import {
  getRunningUploadJobType,
  getUploadDialogState,
} from '~/features/upload/selectors';
import { closeUploadDialog } from '~/features/upload/slice';
import AnotherJobTypeRunningHint from '~/features/upload/AnotherJobTypeRunningHint';
import UploadPanel from '~/features/upload/UploadPanel';

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
  }),
  // mapDispatchToProps
  {
    onClose: closeUploadDialog,
    onStartUpload: startUploadJobFromUploadDialog,
  }
)(UploadDialog);
