import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
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
  t,
  waiting,
}) => (
  <Box display='flex' justifyContent='space-around'>
    <UploadStatusLegendButton
      counter={waiting}
      label={t('uploadStatusLegend.waiting')}
      status={Status.INFO}
      tooltip={t('uploadStatusLegend.clearUploadQueue')}
      onClick={onClearUploadQueue}
    />
    <UploadStatusLegendButton
      counter={inProgress}
      label={t('uploadStatusLegend.inProgress')}
      status={Status.WARNING}
    />
    <UploadStatusLegendButton
      counter={finished}
      label={t('uploadStatusLegend.successful')}
      tooltip={t('uploadStatusLegend.restartSuccessfulItems')}
      status={Status.SUCCESS}
      onClick={onRestartSuccessfulUploads}
    />
    <UploadStatusLegendButton
      counter={failed}
      label={t('uploadStatusLegend.failed')}
      status={Status.ERROR}
      tooltip={t('uploadStatusLegend.retryFailedItems')}
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
  t: PropTypes.func,
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
)(withTranslation()(UploadStatusLegend));
