import Clear from '@mui/icons-material/Clear';
import NavigateBack from '@mui/icons-material/NavigateBefore';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Fade from '@mui/material/Fade';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import type { Theme } from '@mui/material/styles';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { Colors, makeStyles } from '@skybrush/app-theme-mui';
import {
  LabeledStatusLight,
  type LabeledStatusLightProps,
} from '@skybrush/mui-components';

import { Status } from '~/components/semantics';
import {
  getEstimatedCompletionTime,
  getLastUploadResultByJobType,
  getUploadDialogState,
  hasHiddenTargets,
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
import { formatDurationAsText } from '~/utils/formatting';
import { usePeriodicRefresh } from '~/hooks';

type UploadResultIndicatorProps = Omit<LabeledStatusLightProps, 'children'> &
  Readonly<{
    completionTime?: number;
    result?: 'success' | 'error' | 'cancelled';
    running?: boolean;
  }>;

/**
 * Helper component that shows an alert summarizing the result of the last
 * upload attempt.
 */
const UploadResultIndicator = ({
  completionTime,
  result,
  running,
  ...rest
}: UploadResultIndicatorProps): React.JSX.Element => {
  const { t } = useTranslation();

  let status;
  let message;

  const now = Date.now();
  const timeRemaining = completionTime
    ? completionTime > now
      ? (completionTime - now) / 1000
      : undefined
    : undefined;
  usePeriodicRefresh(timeRemaining ? 500 : null);

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

  if (running) {
    status = Status.NEXT;
    if (typeof timeRemaining === 'number' && timeRemaining > 0) {
      message = t('uploadPanel.uploadInProgressWithEstimate', {
        time: formatDurationAsText(timeRemaining, t),
      });
    } else {
      message = t('uploadPanel.uploadInProgress');
    }
  }

  return (
    <LabeledStatusLight
      color='textSecondary'
      status={status}
      size='small'
      {...rest}
    >
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
  warningText: {
    color: Colors.warning,
  },
}));

type UploadPanelProps = Readonly<{
  autoRetry: boolean;
  completionTime?: number;
  flashFailed: boolean;
  hasHiddenTargets: boolean;
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
  completionTime,
  flashFailed,
  hasHiddenTargets,
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
}: UploadPanelProps): React.JSX.Element => {
  const classes = useStyles();
  const { t } = useTranslation();

  return (
    <>
      <DialogContent>
        <UploadStatusLights />
        <UploadStatusLegend />
        <Box sx={{ mt: 1 }}>
          <UploadProgressBar />
        </Box>
        <Box sx={{ mt: 1 }}>
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
        {hasHiddenTargets && (
          <Alert severity='warning' variant='filled'>
            <Box>{t('uploadPanel.hasHiddenTargets')}</Box>
          </Alert>
        )}
      </DialogContent>
      <DialogActions className={classes.actions}>
        {onStepBack && (
          <IconButton size='small' edge='start' onClick={onStepBack}>
            <NavigateBack />
          </IconButton>
        )}
        <Fade in={(lastUploadResult && showLastUploadResult) || running}>
          <Box
            className={classes.uploadResultIndicator}
            onClick={onDismissLastUploadResult}
          >
            <UploadResultIndicator
              completionTime={completionTime}
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
            className={hasHiddenTargets ? classes.warningText : undefined}
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
    completionTime: getEstimatedCompletionTime(state),
    flashFailed: shouldFlashLightsOfFailedUploads(state),
    hasHiddenTargets: hasHiddenTargets(state),
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
