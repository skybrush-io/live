import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

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
      <Box sx={{ mx: 3, mt: 3 }}>
        <RTKCorrectionSourceSelector />
        <Box
          sx={{
            height: 100,
            my: 2,
            boxSizing: 'content-box',
            overflow: 'auto',
          }}
        >
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
