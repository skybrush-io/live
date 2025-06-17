import Clear from '@mui/icons-material/Clear';
import NavigateBack from '@mui/icons-material/NavigateBefore';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Fade from '@mui/material/Fade';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import type { Theme } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import LabeledStatusLight, {
  type LabeledStatusLightProps,
} from '@skybrush/mui-components/lib/LabeledStatusLight';

import { Status } from '~/components/semantics';
import {
  getLastUploadResultByJobType,
  getUploadDialogState,
  hasQueuedItems,
  isUploadInProgress,
  shouldFlashLightsOfFailedUploads,
  shouldRetryFailedUploadsAutomatically,
} from '~/features/upload/selectors';
import {
  cancelUpload,
  closeUploadDialog,
  dismissLastUploadResult,
  setFlashFailed,
  setUploadAutoRetry,
} from '~/features/upload/slice';
import StartUploadButton from '~/features/upload/StartUploadButton';
import UploadProgressBar from '~/features/upload/UploadProgressBar';
import UploadStatusLegend from '~/features/upload/UploadStatusLegend';
import UploadStatusLights from '~/features/upload/UploadStatusLights';
import type { AppThunk, RootState } from '~/store/reducers';

type UploadResultIndicatorProps = Omit<LabeledStatusLightProps, 'children'> &
  Readonly<{
    result?: 'success' | 'error' | 'cancelled';
    running?: boolean;
  }>;

/**
 * Helper componeht that shows an alert summarizing the result of the last
 * upload attempt.
 */
const UploadResultIndicator = ({
  result,
  running,
  ...rest
}: UploadResultIndicatorProps): JSX.Element => {
  const { t } = useTranslation();

  let status;
  let message;

  if (running) {
    status = Status.NEXT;
    message = t('uploadPanel.uploadInProgress');
  }

  switch (result) {
    case 'success':
      status = Status.SUCCESS;
      message = t('uploadPanel.uploadFinishedSuccessfully');
      break;

    case 'cancelled':
      status = Status.WARNING;
      message = t('uploadPanel.uploadCancelled');
      break;

    case 'error':
      status = Status.ERROR;
      message = t('uploadPanel.uploadAttemptFailed');
      break;

    default:
      status = Status.INFO;
      message = t('uploadPanel.uploadNotFinishedYet');
      break;
  }

  return (
    <LabeledStatusLight status={status} size='small' {...rest}>
      {message}
    </LabeledStatusLight>
  );
};

const useStyles = makeStyles((theme: Theme) => ({
  actions: {
    padding: theme.spacing(1, 3, 1, 3),
  },
  uploadResultIndicator: {
    flex: 1,
    cursor: 'pointer',
  },
}));

type UploadPanelProps = Readonly<{
  autoRetry: boolean;
  flashFailed: boolean;
  hasQueuedItems: boolean;
  jobType: string;
  lastUploadResult?: 'success' | 'error' | 'cancelled';
  onCancelUpload: () => void;
  onDismissLastUploadResult: () => void;
  onStartUpload?: () => void;
  onStepBack?: () => void;
  onToggleAutoRetry: () => void;
  onToggleFlashFailed: () => void;
  running?: boolean;
  showLastUploadResult?: boolean;
}>;

/**
 * Presentation component for the main panel that allows the user to monitor the
 * status of an upload job.
 */
const UploadPanel = ({
  autoRetry,
  flashFailed,
  hasQueuedItems,
  lastUploadResult,
  onCancelUpload,
  onDismissLastUploadResult,
  onStartUpload,
  onStepBack,
  onToggleAutoRetry,
  onToggleFlashFailed,
  running = false,
  showLastUploadResult = false,
}: UploadPanelProps): JSX.Element => {
  const classes = useStyles();
  const { t } = useTranslation();

  return (
    <>
      <DialogContent>
        <UploadStatusLights />
        <UploadStatusLegend />
        <Box mt={1}>
          <UploadProgressBar />
        </Box>
        <Box mt={1}>
          <FormControlLabel
            control={
              <Checkbox checked={autoRetry} onChange={onToggleAutoRetry} />
            }
            label={t('uploadPanel.retryFailedAttempts')}
          />
          <FormControlLabel
            control={
              <Checkbox checked={flashFailed} onChange={onToggleFlashFailed} />
            }
            label={t('uploadPanel.flashLightsWhereFailed')}
          />
        </Box>
      </DialogContent>
      <DialogActions className={classes.actions}>
        {onStepBack && (
          <IconButton size='small' edge='start' onClick={onStepBack}>
            <NavigateBack />
          </IconButton>
        )}
        <Fade in={lastUploadResult && showLastUploadResult}>
          <Box
            className={classes.uploadResultIndicator}
            onClick={onDismissLastUploadResult}
          >
            <UploadResultIndicator
              result={lastUploadResult}
              running={running}
            />
          </Box>
        </Fade>
        {running ? (
          <Button
            color='secondary'
            startIcon={<Clear />}
            onClick={onCancelUpload}
          >
            {t('uploadPanel.cancelUpload')}
          </Button>
        ) : (
          <StartUploadButton
            disabled={!onStartUpload}
            hasQueuedItems={hasQueuedItems}
            onClick={onStartUpload}
          />
        )}
      </DialogActions>
    </>
  );
};

export default connect(
  // mapStateToProps
  (
    state: RootState,
    ownProps: Pick<UploadPanelProps, 'jobType' | 'onStepBack' | 'onStartUpload'>
  ) => ({
    ...getUploadDialogState(state),
    autoRetry: shouldRetryFailedUploadsAutomatically(state),
    flashFailed: shouldFlashLightsOfFailedUploads(state),
    hasQueuedItems: hasQueuedItems(state),
    lastUploadResult: getLastUploadResultByJobType(state, ownProps.jobType),
    running: isUploadInProgress(state),
  }),

  // mapDispatchToProps
  {
    onCancelUpload: cancelUpload,
    onClose: closeUploadDialog,
    onDismissLastUploadResult: dismissLastUploadResult,
    onToggleAutoRetry: (): AppThunk => (dispatch, getState) => {
      const state = getState();
      const autoRetry = shouldRetryFailedUploadsAutomatically(state);
      dispatch(setUploadAutoRetry(!autoRetry));
    },
    onToggleFlashFailed: (): AppThunk => (dispatch, getState) => {
      const state = getState();
      const flashFailed = shouldFlashLightsOfFailedUploads(state);
      dispatch(setFlashFailed(!flashFailed));
    },
  }
)(UploadPanel);
