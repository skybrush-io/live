/**
 * @file The global error dialog that appears on top of the main window when
 * there is an unexpected error.
 */

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { closeErrorDialog } from '~/features/error-handling/actions';

/**
 * Presentation component for the global error dialog.
 *
 * @returns  {Object}  the rendered component
 */
const GlobalErrorDialogPresentation = ({ open, message, onClose }) => (
  <Dialog open={open}>
    <DialogTitle>An error happened</DialogTitle>
    <DialogContent>
      <DialogContentText>{message}</DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Close</Button>
    </DialogActions>
  </Dialog>
);

GlobalErrorDialogPresentation.propTypes = {
  message: PropTypes.string,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func,
};

/**
 * Global error dialog.
 */
const GlobalErrorDialog = connect(
  // mapStateToProps
  (state) => state.dialogs.error,
  // mapDispatchToProps
  {
    onClose: closeErrorDialog,
  }
)(GlobalErrorDialogPresentation);

export default GlobalErrorDialog;
