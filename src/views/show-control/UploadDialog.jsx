import isEmpty from 'lodash-es/isEmpty';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Divider from '@material-ui/core/Divider';
import Fade from '@material-ui/core/Fade';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import IconButton from '@material-ui/core/IconButton';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import { makeStyles } from '@material-ui/core/styles';
import Clear from '@material-ui/icons/Clear';
import CloudUpload from '@material-ui/icons/CloudUpload';
import Refresh from '@material-ui/icons/Refresh';
import Alert from '@material-ui/lab/Alert';

import DronePlaceholderList from './DronePlaceholderList';

import { getUAVIdsParticipatingInMission } from '~/features/mission/selectors';
import { retryFailedUploads } from '~/features/show/actions';
import { getItemsInUploadBacklog } from '~/features/show/selectors';
import {
  cancelUpload,
  clearUploadQueue,
  closeUploadDialog,
  dismissLastUploadResult,
  prepareForNextUpload,
  setUploadTarget,
  startUpload
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
    onClose: onDismiss
  };

  switch (result) {
    case 'success':
      alert = (
        <Alert severity="success" {...alertProps}>
          Upload finished successfully.
        </Alert>
      );
      break;

    case 'cancelled':
      alert = (
        <Alert severity="warning" {...alertProps}>
          Upload cancelled by user.
        </Alert>
      );
      break;

    case 'error':
      alert = (
        <Alert severity="error" {...alertProps}>
          Upload attempt failed.
        </Alert>
      );
      break;

    default:
      alert = (
        <Alert severity="info" {...alertProps}>
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
  result: PropTypes.oneOf(['success', 'error', 'cancelled'])
};

const useStyles = makeStyles(theme => ({
  uploadResultIndicator: {
    position: 'absolute',
    top: 0,
    left: theme.spacing(2),
    right: theme.spacing(2),
    boxShadow: theme.shadows[2]
  }
}));

/**
 * Presentation component for the dialog that allows the user to upload the
 * trajectories and light programs to the drones.
 */
const UploadDialog = ({
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
  itemsInBacklog,
  itemsWaitingToStart,
  running,
  selectedUAVIds,
  showLastUploadResult,
  uploadTarget
}) => {
  const classes = useStyles();

  return (
    <Dialog fullWidth open={open} maxWidth="sm" onClose={onClose}>
      <DialogContent style={{ minHeight: 240 }}>
        <RadioGroup
          row
          value={uploadTarget}
          onChange={event => onChangeUploadTarget(event.target.value)}
        >
          <FormControlLabel
            value="all"
            disabled={running}
            control={<Radio />}
            label="All drones"
          />
          <FormControlLabel
            value="selected"
            disabled={running || isEmpty(selectedUAVIds)}
            control={<Radio />}
            label="Selected drones only"
          />
        </RadioGroup>

        <Divider />

        <DronePlaceholderList
          title="Queued:"
          items={itemsInBacklog}
          emptyMessage="No drones in upload queue."
          actions={
            isEmpty(itemsWaitingToStart) ? null : (
              <IconButton edge="end" onClick={onClearUploadQueue}>
                <Clear />
              </IconButton>
            )
          }
        />
        <DronePlaceholderList
          title="In progress:"
          items={itemsInProgress}
          emptyMessage="No uploads are in progress."
        />
        <DronePlaceholderList
          title="Failed:"
          items={failedItems}
          emptyMessage="No failures."
          actions={
            isEmpty(failedItems) ? null : (
              <IconButton edge="end" onClick={onRetryFailedUploads}>
                <Refresh />
              </IconButton>
            )
          }
        />
        <Fade in={showLastUploadResult}>
          <UploadResultIndicator
            className={classes.uploadResultIndicator}
            result={lastUploadResult}
            onDismiss={onDismissLastUploadResult}
          />
        </Fade>
      </DialogContent>
      <DialogActions>
        {running ? (
          <Button
            color="secondary"
            startIcon={<Clear />}
            onClick={onCancelUpload}
          >
            Cancel upload
          </Button>
        ) : (
          <Button
            color="primary"
            startIcon={<CloudUpload />}
            onClick={onStartUpload}
          >
            Start upload
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

UploadDialog.propTypes = {
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
  open: PropTypes.bool,
  itemsInBacklog: PropTypes.arrayOf(PropTypes.string),
  itemsWaitingToStart: PropTypes.arrayOf(PropTypes.string),
  running: PropTypes.bool,
  selectedUAVIds: PropTypes.arrayOf(PropTypes.string),
  showLastUploadResult: PropTypes.bool,
  uploadTarget: PropTypes.oneOf(['all', 'selected'])
};

UploadDialog.defaultProps = {
  open: false,
  running: false,
  showLastUploadResult: false,
  uploadTarget: 'all'
};

// TODO(ntamas): most selectors should return a combination of show and
// drone IDs

export default connect(
  // mapStateToProps
  state => ({
    ...state.show.uploadDialog,
    ...state.show.upload,
    itemsInBacklog: getItemsInUploadBacklog(state),
    selectedUAVIds: getSelectedUAVIds(state)
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
      const uavIds = getUAVIdsParticipatingInMission(getState());
      dispatch(prepareForNextUpload(uavIds));
      dispatch(startUpload());
    }
  }
)(UploadDialog);
