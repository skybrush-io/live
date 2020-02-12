import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import Clear from '@material-ui/icons/Clear';
import CloudUpload from '@material-ui/icons/CloudUpload';

import Header from '~/components/dialogs/FormHeader';
import {
  cancelUploadToDrones,
  uploadShowToDrones
} from '~/features/show/actions';
import { closeUploadDialog, setUploadTarget } from '~/features/show/slice';

/**
 * Presentation component for the dialog that allows the user to upload the
 * trajectories and light programs to the drones.
 */
const UploadDialog = ({
  open,
  onCancelUpload,
  onChangeUploadTarget,
  onClose,
  onStartUpload,
  running,
  uploadTarget
}) => {
  return (
    <Dialog fullWidth open={open} maxWidth="xs" onClose={onClose}>
      <DialogContent>
        <RadioGroup
          row
          disabled={running}
          value={uploadTarget}
          onChange={event => onChangeUploadTarget(event.target.value)}
        >
          <FormControlLabel
            value="all"
            control={<Radio />}
            label="All drones"
          />
          <FormControlLabel
            value="selected"
            control={<Radio />}
            label="Selected drones only"
          />
        </RadioGroup>

        <Header>Uploads in progress</Header>

        <Header>Upload queue</Header>
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
          <Button startIcon={<CloudUpload />} onClick={() => onStartUpload()}>
            Start upload
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

UploadDialog.propTypes = {
  onCancelUpload: PropTypes.func,
  onClose: PropTypes.func,
  onChangeUploadTarget: PropTypes.func,
  onStartUpload: PropTypes.func,
  open: PropTypes.bool,
  running: PropTypes.bool,
  uploadTarget: PropTypes.oneOf(['all', 'selected'])
};

UploadDialog.defaultProps = {
  open: false,
  running: false,
  uploadTarget: 'all'
};

// TODO(ntamas): most selectors should return a combination of show and
// drone IDs

export default connect(
  // mapStateToProps
  state => ({
    ...state.show.uploadDialog,
    ...state.show.upload
  }),

  // mapDispatchToProps
  {
    onCancelUpload: cancelUploadToDrones,
    onChangeUploadTarget: setUploadTarget,
    onClose: closeUploadDialog,
    onStartUpload: uploadShowToDrones
  }
)(UploadDialog);
