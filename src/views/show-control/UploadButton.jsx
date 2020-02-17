import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import ListItem from '@material-ui/core/ListItem';

import UploadProgressBar from './UploadProgressBar';

import ListItemTextWithProgress from '~/components/ListItemTextWithProgress';
import StepperStatusLight, {
  StepperStatus
} from '~/components/StepperStatusLight';
import {
  getUploadProgress,
  isUploadInProgress
} from '~/features/show/selectors';
import { openUploadDialog } from '~/features/show/slice';
import { getSetupStageStatuses } from '~/features/show/stages';

/**
 * React component for the button that allows the user to start or stop the
 * upload process of the current show to the drones.
 */
const UploadButton = ({ loading, status, ...rest }) => (
  <ListItem button disabled={false && status === StepperStatus.OFF} {...rest}>
    <StepperStatusLight status={status} />
    <ListItemTextWithProgress
      primary={
        loading ? 'Please wait, uploading show data...' : 'Upload show data'
      }
      secondary={
        loading ? (
          <UploadProgressBar />
        ) : (
          'Click here to start the upload process'
        )
      }
    />
  </ListItem>
);

UploadButton.propTypes = {
  loading: PropTypes.bool,
  onClick: PropTypes.func,
  status: PropTypes.oneOf(Object.values(StepperStatus))
};

export default connect(
  // mapStateToProps
  state => ({
    loading: isUploadInProgress(state),
    progress: getUploadProgress(state),
    status: getSetupStageStatuses(state).uploadShow
  }),
  // mapDispatchToProps
  {
    onClick: openUploadDialog
  }
)(UploadButton);
