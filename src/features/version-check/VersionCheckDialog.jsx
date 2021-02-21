import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
// import AutoSizer from 'react-virtualized-auto-sizer';

import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';

import { closeVersionCheckDialog } from './slice';
import VersionCheckGrid from './VersionCheckGrid';

/**
 * Presentation component for the dialog that allows the user to check the
 * version numbers of the individual components of the connected drones.
 */
const VersionCheckDialog = ({ onClose, open }) => (
  <Dialog fullWidth open={open} maxWidth='sm' onClose={onClose}>
    <VersionCheckGrid height={160} width={400} />
  </Dialog>
);

VersionCheckDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    open: state.versionCheck.dialog.open,
  }),

  // mapDispatchToProps
  {
    onClose: closeVersionCheckDialog,
  }
)(VersionCheckDialog);
