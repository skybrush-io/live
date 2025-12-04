import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Dialog from '@material-ui/core/Dialog';

import RTKCorrectionSourceSelector from './RTKCorrectionSourceSelector';
import RTKMessageStatistics from './RTKMessageStatistics';
import RTKSetupDialogBottomPanel from './RTKSetupDialogBottomPanel';
import RTKStatusUpdater from './RTKStatusUpdater';
import { closeRTKSetupDialog } from './slice';

/**
 * Presentation component for the dialog that allows the user to set up and
 * monitor the RTK correction source for the UAVs.
 */
const RTKSetupDialog = ({ onClose, open }) => (
  <Dialog fullWidth open={open} maxWidth='sm' onClose={onClose}>
    <RTKStatusUpdater />
    <Box>
      <Box mx={3} mt={3}>
        <RTKCorrectionSourceSelector />
        <Box height={100} my={2} boxSizing='content-box' overflow='auto'>
          <RTKMessageStatistics />
        </Box>
      </Box>
      <RTKSetupDialogBottomPanel />
    </Box>
  </Dialog>
);

RTKSetupDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    open: state.rtk.dialog.open,
  }),

  // mapDispatchToProps
  {
    onClose: closeRTKSetupDialog,
  }
)(RTKSetupDialog);
