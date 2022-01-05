import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';

import { Status } from '~/components/semantics';

import { restartSuccessfulUploads, retryFailedUploads } from './actions';
import { getUploadStatusCodeCounters } from './selectors';
import { clearUploadQueue } from './slice';
import UploadStatusLegendButton from './UploadStatusLegendButton';

const UploadStatusLegend = ({
  failed,
  finished,
  inProgress,
  onClearUploadQueue,
  onRestartSuccessfulUploads,
  onRetryFailedUploads,
  waiting,
}) => (
  <Box display='flex' justifyContent='space-around'>
    <UploadStatusLegendButton
      counter={waiting}
      label='waiting'
      status={Status.INFO}
      tooltip='Clear upload queue'
      onClick={onClearUploadQueue}
    />
    <UploadStatusLegendButton
      counter={inProgress}
      label='in progress'
      status={Status.WARNING}
    />
    <UploadStatusLegendButton
      counter={finished}
      label='successful'
      tooltip='Restart successful items'
      status={Status.SUCCESS}
      onClick={onRestartSuccessfulUploads}
    />
    <UploadStatusLegendButton
      counter={failed}
      label='failed'
      status={Status.ERROR}
      tooltip='Retry failed items'
      onClick={onRetryFailedUploads}
    />
  </Box>
);

UploadStatusLegend.propTypes = {
  failed: PropTypes.number,
  finished: PropTypes.number,
  inProgress: PropTypes.number,
  waiting: PropTypes.number,
  onClearUploadQueue: PropTypes.func,
  onRestartSuccessfulUploads: PropTypes.func,
  onRetryFailedUploads: PropTypes.func,
};

export default connect(
  // mapStateToProps
  getUploadStatusCodeCounters,
  // mapDispatchToProps
  {
    onClearUploadQueue: clearUploadQueue,
    onRestartSuccessfulUploads: restartSuccessfulUploads,
    onRetryFailedUploads: retryFailedUploads,
  }
)(UploadStatusLegend);
