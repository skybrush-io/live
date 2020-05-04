/**
 * @file Generic single-line input dialog to act as a replacement
 * for `window.prompt()`.
 */

import config from 'config';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

const SessionExpiryDialog = ({ onClose, open }) => (
  <Dialog open={open} disableBackdropClick disableEscapeKeyDown>
    <DialogTitle>Session expired</DialogTitle>
    <DialogContent>
      <DialogContentText>
        Your demo session has expired. Thank you for evaluating Skybrush Live!
      </DialogContentText>
      <Button onClick={onClose} fullWidth>
        Click here to return to your Skybrush account
      </Button>
      <DialogContentText>{' '}</DialogContentText>
    </DialogContent>
  </Dialog>
);

SessionExpiryDialog.propTypes = {
  open: PropTypes.bool,
  expiresAt: PropTypes.number,
};

export default connect(
  // mapStateToProps
  (state) => ({
    open: state.session.isExpired,
  }),

  // mapDispatchToProps
  () => ({
    onClose() {
      window.location.replace(config.urls.exit || 'https://skybrush.io');
    }
  })
)(SessionExpiryDialog);
