import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Fade from '@material-ui/core/Fade';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import { makeStyles } from '@material-ui/core/styles';
import Clear from '@material-ui/icons/Clear';

import LabeledStatusLight from '@skybrush/mui-components/lib/LabeledStatusLight';

import { Status } from '~/components/semantics';
import { getUAVIdsParticipatingInMissionSortedByMissionIndex } from '~/features/mission/selectors';
import { getNumberOfDronesInShow } from '~/features/show/selectors';
import {
  areItemsInUploadBacklog,
  getItemsInUploadBacklog,
  getLastUploadResult,
  getUploadDialogState,
  hasQueuedItems,
  isUploadInProgress,
  shouldRetryFailedUploadsAutomatically,
} from '~/features/upload/selectors';
import {
  cancelUpload,
  closeUploadDialog,
  dismissLastUploadResult,
  setupNextUploadJob,
  setUploadAutoRetry,
  startUpload,
} from '~/features/upload/slice';
import StartUploadButton from '~/features/upload/StartUploadButton';
import UploadProgressBar from '~/features/upload/UploadProgressBar';
import UploadStatusLegend from '~/features/upload/UploadStatusLegend';
import UploadStatusLights from '~/features/upload/UploadStatusLights';

/**
 * Helper componeht that shows an alert summarizing the result of the last
 * upload attempt.
 */
const UploadResultIndicator = ({ result, running, ...rest }) => {
  let status;
  let message;

  if (running) {
    status = Status.NEXT;
    message = 'Upload in progress...';
  }

  switch (result) {
    case 'success':
      status = Status.SUCCESS;
      message = 'Upload finished successfully.';
      break;

    case 'cancelled':
      status = Status.WARNING;
      message = 'Upload cancelled by user.';
      break;

    case 'error':
      status = Status.ERROR;
      message = 'Upload attempt failed.';
      break;

    default:
      status = Status.INFO;
      message = 'Upload not finished yet.';
      break;
  }

  return (
    <LabeledStatusLight status={status} size='small' {...rest}>
      {message}
    </LabeledStatusLight>
  );
};

UploadResultIndicator.propTypes = {
  result: PropTypes.oneOf(['success', 'error', 'cancelled']),
  running: PropTypes.bool,
};

const useStyles = makeStyles((theme) => ({
  actions: {
    padding: theme.spacing(1, 3, 1, 3),
  },
  uploadResultIndicator: {
    flex: 1,
    cursor: 'pointer',
  },
}));

/**
 * Presentation component for the dialog that allows the user to upload the
 * trajectories and light programs to the drones.
 */
const UploadDialogContent = ({
  autoRetry,
  canStartUpload,
  hasQueuedItems,
  lastUploadResult,
  onCancelUpload,
  onDismissLastUploadResult,
  onStartUpload,
  onToggleAutoRetry,
  running,
  showLastUploadResult,
}) => {
  const classes = useStyles();

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
            label='Retry failed attempts automatically'
          />
        </Box>
      </DialogContent>
      <DialogActions className={classes.actions}>
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
            Cancel upload
          </Button>
        ) : (
          <StartUploadButton
            disabled={!canStartUpload}
            hasQueuedItems={hasQueuedItems}
            onClick={onStartUpload}
          />
        )}
      </DialogActions>
    </>
  );
};

UploadDialogContent.propTypes = {
  autoRetry: PropTypes.bool,
  canStartUpload: PropTypes.bool,
  hasQueuedItems: PropTypes.bool,
  lastUploadResult: PropTypes.oneOf(['success', 'error', 'cancelled']),
  onCancelUpload: PropTypes.func,
  onDismissLastUploadResult: PropTypes.func,
  onStartUpload: PropTypes.func,
  onToggleAutoRetry: PropTypes.func,
  running: PropTypes.bool,
  showLastUploadResult: PropTypes.bool,
};

UploadDialogContent.defaultProps = {
  running: false,
  showLastUploadResult: false,
};

// TODO(ntamas): most selectors should return a combination of show and
// drone IDs

export default connect(
  // mapStateToProps
  (state) => ({
    ...getUploadDialogState(state),
    autoRetry: shouldRetryFailedUploadsAutomatically(state),
    canStartUpload: getNumberOfDronesInShow(state) > 0,
    hasQueuedItems: hasQueuedItems(state),
    lastUploadResult: getLastUploadResult(state),
    running: isUploadInProgress(state),
  }),

  // mapDispatchToProps
  {
    onCancelUpload: cancelUpload,
    onClose: closeUploadDialog,
    onDismissLastUploadResult: dismissLastUploadResult,
    onStartUpload: () => (dispatch, getState) => {
      const state = getState();
      let targets;

      if (!areItemsInUploadBacklog(state)) {
        // If there are no items currently in the upload backlog, start the
        // upload for all the UAVs in the mission, clearing the previous
        // "failed" and "successful" markers as well. (This is what
        // setupNextUploadJob() does). We need the UAV IDs in ascending
        // mission index instead because this would mean that UAVs
        // with a lower mission index (i.e. probably closer to the GCS) get
        // uploaded first.
        targets = getUAVIdsParticipatingInMissionSortedByMissionIndex(state);
      } else {
        // There are some items in the backlog so these are the upload targets.
        targets = getItemsInUploadBacklog(state);
      }

      // Set up the next upload job and start it
      if (targets && targets.length > 0) {
        dispatch(setupNextUploadJob({ targets, type: 'show-upload' }));
        dispatch(startUpload());
      }
    },
    onToggleAutoRetry: () => (dispatch, getState) => {
      const state = getState();
      const autoRetry = shouldRetryFailedUploadsAutomatically(state);
      dispatch(setUploadAutoRetry(!autoRetry));
    },
  }
)(UploadDialogContent);
