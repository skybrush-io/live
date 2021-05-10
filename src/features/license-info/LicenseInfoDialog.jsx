import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import LicenseInfoPanel from './LicenseInfoPanel';
import { closeLicenseInfoDialog } from './slice';

/**
 * Presentation component for the dialog that allows the user to retrieve the
 * information about the license on the server.
 */
const LicenseInfoDialog = ({ onClose, open }) => (
  <DraggableDialog
    fullWidth
    open={open}
    maxWidth='xs'
    title='License information'
    onClose={onClose}
  >
    <DialogContent>
      <LicenseInfoPanel />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </DraggableDialog>
);

LicenseInfoDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    open: state.licenseInfo.dialog.open,
  }),

  // mapDispatchToProps
  {
    onClose: closeLicenseInfoDialog,
  }
)(LicenseInfoDialog);
