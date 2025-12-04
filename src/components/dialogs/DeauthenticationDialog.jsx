/**
 * @file The authentication dialog that appears on top of the main window when
 * the user needs to (or tries to) authenticate to the current server.
 */

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';
import { batch, connect } from 'react-redux';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import {
  closeDeauthenticationDialog,
  disconnectFromServer,
} from '~/features/servers/actions';
import { getAuthenticatedUser } from '~/features/servers/selectors';
import { clearAuthenticationToken } from '~/features/servers/slice';

/**
 * Presentation component for the authentication dialog.
 *
 * @returns  {Object}  the rendered component
 */
const DeauthenticationDialogPresentation = ({
  onCancel,
  onDisconnect,
  open = false,
  title,
  user,
}) => (
  <DraggableDialog maxWidth='xs' open={open} title={title}>
    <DialogContent>
      <Box>
        <Typography sx={{ marginBottom: '16px' }}>
          {user ? (
            <>
              You are currently authenticated as <code>{user}</code>. Are you
              sure you would like to disconnect?
            </>
          ) : (
            <>
              You are not authenticated at the moment. Are you sure you would
              like to disconnect?
            </>
          )}
        </Typography>
      </Box>
    </DialogContent>
    <DialogActions>
      <Button color='secondary' onClick={onDisconnect}>
        Disconnect
      </Button>
      <Button onClick={onCancel}>Cancel</Button>
    </DialogActions>
  </DraggableDialog>
);

DeauthenticationDialogPresentation.propTypes = {
  onCancel: PropTypes.func,
  onDisconnect: PropTypes.func,
  open: PropTypes.bool,
  title: PropTypes.string.isRequired,
  user: PropTypes.string,
};

/**
 * Authentication dialog.
 */
const DeauthenticationDialog = connect(
  // mapStateToProps
  (state) => ({
    ...state.dialogs.deauthentication,
    title: 'Log out from server',
    user: getAuthenticatedUser(state),
  }),
  // mapDispatchToProps
  (dispatch) => ({
    onCancel() {
      dispatch(closeDeauthenticationDialog());
    },

    onDisconnect() {
      batch(() => {
        dispatch(closeDeauthenticationDialog());
        dispatch(clearAuthenticationToken());
        dispatch(disconnectFromServer());
      });
    },
  })
)(DeauthenticationDialogPresentation);

export default DeauthenticationDialog;
