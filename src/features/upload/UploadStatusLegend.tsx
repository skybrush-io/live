import Box from '@mui/material/Box';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { Status } from '~/components/semantics';
import type { RootState } from '~/store/reducers';

import {
  enqueueFailedUploads,
  enqueueItemsWithNoUploadStatus,
  enqueueSuccessfulUploads,
} from './actions';
import { getUploadStatusCodeCounters, isUploadInProgress } from './selectors';
import { clearUploadQueue } from './slice';
import UploadStatusLegendButton from './UploadStatusLegendButton';

type StateProps = {
  failed: number;
  finished: number;
  inProgress: number;
  isUploadInProgress: boolean;
  waiting: number;
};

type DispatchProps = {
  enqueueItemsWithNoUploadStatus: () => void;
  clearUploadQueue: () => void;
  enqueueSuccessfulUploads: () => void;
  enqueueFailedUploads: () => void;
};

type UploadStatusLegendProps = StateProps & DispatchProps;

const UploadStatusLegend = ({
  failed,
  finished,
  inProgress,
  isUploadInProgress,
  clearUploadQueue,
  enqueueSuccessfulUploads,
  enqueueFailedUploads,
  enqueueItemsWithNoUploadStatus,
  waiting,
}: UploadStatusLegendProps) => {
  const { t } = useTranslation();

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
      <UploadStatusLegendButton
        counter={waiting}
        disabled={isUploadInProgress}
        label={t('general.status.waiting')}
        status={Status.INFO}
        tooltip={
          waiting === 0
            ? t('uploadStatusLegend.enqueueItemsWithNoUploadStatus')
            : t('uploadStatusLegend.clearUploadQueue')
        }
        onClick={() => {
          if (waiting === 0) {
            enqueueItemsWithNoUploadStatus();
          } else {
            clearUploadQueue();
          }
        }}
      />
      <UploadStatusLegendButton
        disabled
        counter={inProgress}
        label={t('general.status.inProgress')}
        status={Status.WARNING}
      />
      <UploadStatusLegendButton
        counter={finished}
        disabled={finished === 0}
        label={t('general.status.successful')}
        tooltip={t('uploadStatusLegend.restartSuccessfulItems')}
        status={Status.SUCCESS}
        onClick={() => {
          enqueueSuccessfulUploads();
        }}
      />
      <UploadStatusLegendButton
        counter={failed}
        disabled={failed === 0}
        label={t('general.status.failed')}
        status={Status.ERROR}
        tooltip={t('uploadStatusLegend.retryFailedItems')}
        onClick={() => {
          enqueueFailedUploads();
        }}
      />
    </Box>
  );
};

const ConnectedUploadStatusLegend = connect(
  // mapStateToProps
  (state: RootState) => ({
    ...getUploadStatusCodeCounters(state),
    isUploadInProgress: isUploadInProgress(state),
  }),
  // mapDispatchToProps
  {
    clearUploadQueue,
    enqueueFailedUploads,
    enqueueItemsWithNoUploadStatus,
    enqueueSuccessfulUploads,
  }
)(UploadStatusLegend);

export default ConnectedUploadStatusLegend;
