import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import {
  closeUploadDialogAndStepBack,
  startUploadJobFromUploadDialog,
} from './actions';
import { getDialogTitleForJobType } from './jobs';
import {
  getRunningUploadJobType,
  getSelectedJobInUploadDialog,
  getUploadDialogState,
} from './selectors';
import { closeUploadDialog } from './slice';
import AnotherJobTypeRunningHint from './AnotherJobTypeRunningHint';
import UploadPanel from './UploadPanel';
import { isNil } from 'lodash-es';

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
