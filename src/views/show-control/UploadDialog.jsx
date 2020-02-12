import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Collapse from '@material-ui/core/Collapse';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Divider from '@material-ui/core/Divider';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import Clear from '@material-ui/icons/Clear';
import CloudUpload from '@material-ui/icons/CloudUpload';
import Alert from '@material-ui/lab/Alert';

import DronePlaceholderList from './DronePlaceholderList';

import { getItemsInUploadBacklog } from '~/features/show/selectors';
import {
  cancelUpload,
  closeUploadDialog,
  dismissLastUploadResult,
  setUploadTarget,
  startUpload
} from '~/features/show/slice';

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
  onClose,
  onDismissLastUploadResult,
  onStartUpload,
  itemsQueued,
  running,
  showLastUploadResult,
  uploadTarget
}) => {
  return (
    <Dialog fullWidth open={open} maxWidth="xs" onClose={onClose}>
      <DialogContent style={{ minHeight: 300 }}>
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
            disabled={running}
            control={<Radio />}
            label="Selected drones only"
          />
        </RadioGroup>

        <Divider />

        <DronePlaceholderList
          title="Queued:"
          items={itemsQueued}
          emptyMessage="No drones in upload queue."
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
        />
        <Collapse in={showLastUploadResult}>
          <UploadResultIndicator
            result={lastUploadResult}
            onDismiss={onDismissLastUploadResult}
          />
        </Collapse>
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
          <Button startIcon={<CloudUpload />} onClick={onStartUpload}>
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
  onClose: PropTypes.func,
  onChangeUploadTarget: PropTypes.func,
  onDismissLastUploadResult: PropTypes.func,
  onStartUpload: PropTypes.func,
  open: PropTypes.bool,
  itemsWaitingToStart: PropTypes.arrayOf(PropTypes.string),
  running: PropTypes.bool,
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
    itemsQueued: getItemsInUploadBacklog(state)
  }),

  // mapDispatchToProps
  {
    onCancelUpload: cancelUpload,
    onChangeUploadTarget: setUploadTarget,
    onClose: closeUploadDialog,
    onDismissLastUploadResult: dismissLastUploadResult,
    onStartUpload: startUpload
  }
)(UploadDialog);
