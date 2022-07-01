/**
 * @file The authentication dialog that appears on top of the main window when
 * the user needs to (or tries to) authenticate to the current server.
 */

import PropTypes from 'prop-types';
import React from 'react';
import { batch, connect } from 'react-redux';
import Button from '@material-ui/core/Button';

import Box from '@material-ui/core/Box';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Typography from '@material-ui/core/Typography';

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
  open,
  title,
  user,
}) => (
  <DraggableDialog maxWidth='xs' open={open} title={title}>
    <DialogContent>
      <Box pt={2}>
        <Typography paragraph>
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

DeauthenticationDialogPresentation.defaultProps = {
  open: false,
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
