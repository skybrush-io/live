import isEmpty from 'lodash-es/isEmpty';
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

import { Status } from '~/components/semantics';
import { getUAVIdsParticipatingInMission } from '~/features/mission/selectors';
import {
  getItemsInUploadBacklog,
  getNumberOfDronesInShow,
  hasQueuedItems,
  isUploadInProgress,
  shouldRetryFailedUploadsAutomatically,
} from '~/features/show/selectors';
import {
  cancelUpload,
  closeUploadDialog,
  dismissLastUploadResult,
  prepareForNextUpload,
  setUploadAutoRetry,
  startUpload,
} from '~/features/show/slice';

import StartUploadButton from './StartUploadButton';
import UploadProgressBar from './UploadProgressBar';
import UploadStatusLegend from './UploadStatusLegend';
import UploadStatusLights from './UploadStatusLights';
import LabeledStatusLight from '@skybrush/mui-components/lib/LabeledStatusLight';

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
            label='Retry failed uploads automatically'
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
    ...state.show.uploadDialog,
    autoRetry: shouldRetryFailedUploadsAutomatically(state),
    canStartUpload: getNumberOfDronesInShow(state) > 0,
    hasQueuedItems: hasQueuedItems(state),
    lastUploadResult: state.show.upload.lastUploadResult,
    running: isUploadInProgress(state),
  }),

  // mapDispatchToProps
  {
    onCancelUpload: cancelUpload,
    onClose: closeUploadDialog,
    onDismissLastUploadResult: dismissLastUploadResult,
    onStartUpload: () => (dispatch, getState) => {
      const state = getState();
      const backlog = getItemsInUploadBacklog(state);
      let canStart = false;

      if (isEmpty(backlog)) {
        // If there are no items currently in the upload backlog, start the
        // upload for all the UAVs in the mission, clearing the previous
        // "failed" and "successful" markers as well. (This is what
        // prepareForNextUpload() does).
        const uavIds = getUAVIdsParticipatingInMission(state);
        if (uavIds && uavIds.length > 0) {
          canStart = true;
          dispatch(prepareForNextUpload(uavIds));
        }
      } else {
        // There are some items in the upload backlog so we don't add new
        // ones, just resume the ones that are in the backlog. We also keep
        // the "failed" and "successful" states of UAVs.
        canStart = true;
      }

      if (canStart) {
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
