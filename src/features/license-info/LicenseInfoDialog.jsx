import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { DraggableDialog } from '@skybrush/mui-components';

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
