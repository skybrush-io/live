import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';

import { signOffOnManualPreflightChecks } from '~/features/show/actions';
import { areManualPreflightChecksSignedOff } from '~/features/show/selectors';
import {
  clearManualPreflightChecks,
  closeManualPreflightChecksDialog
} from '~/features/show/slice';

/**
 * Presentation component for the dialog that allows the user to inspect the
 * status of the manual preflight checks (and the error codes in
 * the fleet in general).
 */
const ManualPreflightChecksDialog = ({
  open,
  onClear,
  onClose,
  onSignOff,
  signedOff
}) => {
  return (
    <Dialog fullWidth open={open} maxWidth="xs" onClose={onClose}>
      <DialogContent>
        <Box className="bottom-bar" textAlign="center" mt={2} pt={2}>
          <FormControlLabel
            control={
              <Switch
                checked={signedOff}
                value="signedOff"
                onChange={signedOff ? onClear : onSignOff}
              />
            }
            label="Sign off on manual preflight checks"
          />
        </Box>
      </DialogContent>
      <DialogActions />
    </Dialog>
  );
};

ManualPreflightChecksDialog.propTypes = {
  onClear: PropTypes.func,
  onClose: PropTypes.func,
  onSignOff: PropTypes.func,
  open: PropTypes.bool,
  signedOff: PropTypes.bool
};

ManualPreflightChecksDialog.defaultProps = {
  open: false,
  signedOff: false
};

export default connect(
  // mapStateToProps
  state => ({
    ...state.show.manualPreflightChecksDialog,
    signedOff: areManualPreflightChecksSignedOff(state)
  }),

  // mapDispatchToProps
  {
    onClear: clearManualPreflightChecks,
    onClose: closeManualPreflightChecksDialog,
    onSignOff: signOffOnManualPreflightChecks
  }
)(ManualPreflightChecksDialog);
