import Box from '@mui/material/Box';
import type { TFunction } from 'i18next';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { Status } from '~/components/semantics';

import { restartSuccessfulUploads, retryFailedUploads } from './actions';
import { getUploadStatusCodeCounters } from './selectors';
import { clearUploadQueue } from './slice';
import UploadStatusLegendButton from './UploadStatusLegendButton';

type UploadStatusLegendProps = Readonly<{
  failed: number;
  finished: number;
  inProgress: number;
  waiting: number;
  onClearUploadQueue: () => void;
  onRestartSuccessfulUploads: () => void;
  onRetryFailedUploads: () => void;
  t: TFunction;
}>;

const UploadStatusLegend = ({
  failed,
  finished,
  inProgress,
  onClearUploadQueue,
  onRestartSuccessfulUploads,
  onRetryFailedUploads,
  t,
  waiting,
}: UploadStatusLegendProps): JSX.Element => (
  <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
    <UploadStatusLegendButton
      counter={waiting}
      label={t('general.status.waiting')}
      status={Status.INFO}
      tooltip={t('uploadStatusLegend.clearUploadQueue')}
      onClick={onClearUploadQueue}
    />
    <UploadStatusLegendButton
      counter={inProgress}
      label={t('general.status.inProgress')}
      status={Status.WARNING}
    />
    <UploadStatusLegendButton
      counter={finished}
      label={t('general.status.successful')}
      tooltip={t('uploadStatusLegend.restartSuccessfulItems')}
      status={Status.SUCCESS}
      onClick={onRestartSuccessfulUploads}
    />
    <UploadStatusLegendButton
      counter={failed}
      label={t('general.status.failed')}
      status={Status.ERROR}
      tooltip={t('uploadStatusLegend.retryFailedItems')}
      onClick={onRetryFailedUploads}
    />
  </Box>
);

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
