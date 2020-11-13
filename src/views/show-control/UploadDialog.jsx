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
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '~/components/Tooltip';
import { makeStyles } from '@material-ui/core/styles';
import Clear from '@material-ui/icons/Clear';
import Refresh from '@material-ui/icons/Refresh';
import Alert from '@material-ui/lab/Alert';

import StartUploadButton from './StartUploadButton';
import UploadProgressBar from './UploadProgressBar';

import DraggableDialog from '~/components/dialogs/DraggableDialog';
import DronePlaceholderList from '~/components/uavs/DronePlaceholderList';
import { getUAVIdsParticipatingInMission } from '~/features/mission/selectors';
import { retryFailedUploads } from '~/features/show/actions';
import {
  getItemsInUploadBacklog,
  getNumberOfDronesInShow,
  shouldRetryFailedUploadsAutomatically,
} from '~/features/show/selectors';
import {
  cancelUpload,
  clearUploadQueue,
  closeUploadDialog,
  dismissLastUploadResult,
  prepareForNextUpload,
  setUploadAutoRetry,
  setUploadTarget,
  startUpload,
} from '~/features/show/slice';
import { getSelectedUAVIds } from '~/selectors/selection';

/**
 * Helper componeht that shows an alert summarizing the result of the last
 * upload attempt.
 */
const UploadResultIndicator = ({ onDismiss, result, ...rest }) => {
  let alert;

  const alertProps = {
    variant: 'filled',
    onClose: onDismiss,
  };

  switch (result) {
    case 'success':
      alert = (
        <Alert severity='success' {...alertProps}>
          Upload finished successfully.
        </Alert>
      );
      break;

    case 'cancelled':
      alert = (
        <Alert severity='warning' {...alertProps}>
          Upload cancelled by user.
        </Alert>
      );
      break;

    case 'error':
      alert = (
        <Alert severity='error' {...alertProps}>
          Upload attempt failed.
        </Alert>
      );
      break;

    default:
      alert = (
        <Alert severity='info' {...alertProps}>
          Upload not finished yet.
        </Alert>
      );
      break;
  }

  return (
    <Box mt={2} {...rest}>
      {alert}
    </Box>
  );
};

UploadResultIndicator.propTypes = {
  onDismiss: PropTypes.func,
  result: PropTypes.oneOf(['success', 'error', 'cancelled']),
};

const useStyles = makeStyles((theme) => ({
  actions: {
    padding: theme.spacing(1, 3, 3, 3),
  },
  uploadResultIndicator: {
    boxShadow: theme.shadows[2],
  },
}));

/**
 * Presentation component for the dialog that allows the user to upload the
 * trajectories and light programs to the drones.
 */
const UploadDialog = ({
  autoRetry,
  canStartUpload,
  failedItems,
  itemsInProgress,
  lastUploadResult,
  open,
  onCancelUpload,
  onChangeUploadTarget,
  onClearUploadQueue,
  onClose,
  onDismissLastUploadResult,
  onRetryFailedUploads,
  onStartUpload,
  onToggleAutoRetry,
  itemsInBacklog,
  itemsWaitingToStart,
  running,
  selectedUAVIds,
  showLastUploadResult,
  uploadTarget,
}) => {
  const classes = useStyles();

  return (
    <DraggableDialog
      fullWidth
      open={open}
      maxWidth='sm'
      title='Upload show data'
      onClose={onClose}
    >
      <DialogContent>
        <DronePlaceholderList
          title='Queued:'
          items={itemsInBacklog}
          emptyMessage='No drones in upload queue.'
          actions={
            isEmpty(itemsWaitingToStart) ? null : (
              <Tooltip content='Clear upload queue'>
                <IconButton edge='end' onClick={onClearUploadQueue}>
                  <Clear />
                </IconButton>
              </Tooltip>
            )
          }
        />
        <DronePlaceholderList
          title='In progress:'
          items={itemsInProgress}
          emptyMessage='No uploads are in progress.'
        />
        <DronePlaceholderList
          title='Failed:'
          items={failedItems}
          emptyMessage='No failures.'
          actions={
            isEmpty(failedItems) ? null : (
              <Tooltip content='Retry failed uploads'>
                <IconButton edge='end' onClick={onRetryFailedUploads}>
                  <Refresh />
                </IconButton>
              </Tooltip>
            )
          }
        />
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
        <Fade in={lastUploadResult && showLastUploadResult}>
          <UploadResultIndicator
            className={classes.uploadResultIndicator}
            result={lastUploadResult}
            onDismiss={onDismissLastUploadResult}
          />
        </Fade>
      </DialogContent>
      <DialogActions className={classes.actions}>
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
            hasSelection={selectedUAVIds && selectedUAVIds.length > 0}
            uploadTarget={uploadTarget}
            onChangeUploadTarget={onChangeUploadTarget}
            onClick={onStartUpload}
          />
        )}
      </DialogActions>
    </DraggableDialog>
  );
};

UploadDialog.propTypes = {
  autoRetry: PropTypes.bool,
  canStartUpload: PropTypes.bool,
  failedItems: PropTypes.arrayOf(PropTypes.string),
  itemsInProgress: PropTypes.arrayOf(PropTypes.string),
  lastUploadResult: PropTypes.oneOf(['success', 'error', 'cancelled']),
  onCancelUpload: PropTypes.func,
  onClearUploadQueue: PropTypes.func,
  onClose: PropTypes.func,
  onChangeUploadTarget: PropTypes.func,
  onDismissLastUploadResult: PropTypes.func,
  onRetryFailedUploads: PropTypes.func,
  onStartUpload: PropTypes.func,
  onToggleAutoRetry: PropTypes.func,
  open: PropTypes.bool,
  itemsInBacklog: PropTypes.arrayOf(PropTypes.string),
  itemsWaitingToStart: PropTypes.arrayOf(PropTypes.string),
  running: PropTypes.bool,
  selectedUAVIds: PropTypes.arrayOf(PropTypes.string),
  showLastUploadResult: PropTypes.bool,
  uploadTarget: PropTypes.oneOf(['all', 'selected']),
};

UploadDialog.defaultProps = {
  open: false,
  running: false,
  showLastUploadResult: false,
  uploadTarget: 'all',
};

// TODO(ntamas): most selectors should return a combination of show and
// drone IDs

export default connect(
  // mapStateToProps
  (state) => ({
    ...state.show.uploadDialog,
    ...state.show.upload,
    autoRetry: shouldRetryFailedUploadsAutomatically(state),
    canStartUpload: getNumberOfDronesInShow(state) > 0,
    itemsInBacklog: getItemsInUploadBacklog(state),
    selectedUAVIds: getSelectedUAVIds(state),
  }),

  // mapDispatchToProps
  {
    onCancelUpload: cancelUpload,
    onChangeUploadTarget: setUploadTarget,
    onClearUploadQueue: clearUploadQueue,
    onClose: closeUploadDialog,
    onDismissLastUploadResult: dismissLastUploadResult,
    onRetryFailedUploads: retryFailedUploads,
    onStartUpload: () => (dispatch, getState) => {
      const state = getState();
      const backlog = getItemsInUploadBacklog(state);
      const { uploadTarget } = state.show.uploadDialog;
      let canStart = false;

      if (isEmpty(backlog)) {
        const uavIds =
          uploadTarget === 'selected'
            ? getSelectedUAVIds(state)
            : getUAVIdsParticipatingInMission(state);
        if (uavIds && uavIds.length > 0) {
          canStart = true;
          dispatch(prepareForNextUpload(uavIds));
        }
      } else {
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
)(UploadDialog);
