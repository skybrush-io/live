/**
 * @file The authentication dialog that appears on top of the main window when
 * the user needs to (or tries to) authenticate to the current server.
 */

import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'
import Typography from '@material-ui/core/Typography'

import PropTypes from 'prop-types'
import React from 'react'
import { batch, connect } from 'react-redux'

import { closeDeauthenticationDialog } from '~/actions/servers'
import { disconnectFromServer } from '~/actions/server-settings'
import { getAuthenticatedUser } from '~/selectors/servers'

/**
 * Presentation component for the authentication dialog.
 *
 * @returns  {Object}  the rendered component
 */
const DeauthenticationDialogPresentation = ({ onCancel, onDisconnect, open, title, user }) => (
  <Dialog maxWidth='xs' open={open}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <Typography paragraph>
        {user ? (
          <>You are currently authenticated as <code>{user}</code>.
          Are you sure you would like to disconnect?</>
        ) : (
          <>You are not authenticated at the moment.
          Are you sure you would like to disconnect?</>
        )}
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onDisconnect} color='secondary'>Disconnect</Button>
      <Button onClick={onCancel}>Cancel</Button>
    </DialogActions>
  </Dialog>
)

DeauthenticationDialogPresentation.propTypes = {
  onCancel: PropTypes.func,
  onDisconnect: PropTypes.func,
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  user: PropTypes.string
}

/**
 * Authentication dialog.
 */
const DeauthenticationDialog = connect(
  // mapStateToProps
  state => ({
    ...state.dialogs.deauthentication,
    title: 'Log out from server',
    user: getAuthenticatedUser(state)
  }),
  // mapDispatchToProps
  dispatch => ({
    onCancel () {
      dispatch(closeDeauthenticationDialog())
    },

    onDisconnect () {
      batch(() => {
        dispatch(closeDeauthenticationDialog())
        dispatch(disconnectFromServer())
      })
    }
  })
)(DeauthenticationDialogPresentation)

export default DeauthenticationDialog
