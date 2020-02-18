import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';

import { signOffOnOnboardPreflightChecks } from '~/features/show/actions';
import { areOnboardPreflightChecksSignedOff } from '~/features/show/selectors';
import {
  clearOnboardPreflightChecks,
  closeOnboardPreflightChecksDialog
} from '~/features/show/slice';

/**
 * Presentation component for the dialog that allows the user to inspect the
 * status of the automatic onboard preflight checks (and the error codes in
 * the fleet in general).
 */
const OnboardPreflightChecksDialog = ({
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
            label="Sign off on onboard preflight checks"
          />
        </Box>
      </DialogContent>
      <DialogActions />
    </Dialog>
  );
};

OnboardPreflightChecksDialog.propTypes = {
  onClear: PropTypes.func,
  onClose: PropTypes.func,
  onSignOff: PropTypes.func,
  open: PropTypes.bool,
  signedOff: PropTypes.bool
};

OnboardPreflightChecksDialog.defaultProps = {
  open: false,
  signedOff: false
};

export default connect(
  // mapStateToProps
  state => ({
    ...state.show.onboardPreflightChecksDialog,
    signedOff: areOnboardPreflightChecksSignedOff(state)
  }),

  // mapDispatchToProps
  {
    onClear: clearOnboardPreflightChecks,
    onClose: closeOnboardPreflightChecksDialog,
    onSignOff: signOffOnOnboardPreflightChecks
  }
)(OnboardPreflightChecksDialog);
