/**
 * @file The authentication dialog that appears on top of the main window when
 * the user needs to (or tries to) authenticate to the current server.
 */

import Button from '@material-ui/core/Button'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogTitle from '@material-ui/core/DialogTitle'

import PropTypes from 'prop-types'
import React from 'react'
import { Form, Field } from 'react-final-form'
import { connect } from 'react-redux'

import {
  authenticateToServer,
  closeAuthenticationDialog
} from '~/actions/servers'
import { PasswordField, TextField } from '~/components/forms'
import messageHub from '~/message-hub'
import {
  isAuthenticating,
  requiresAuthentication
} from '~/selectors/servers'

/**
 * Presentation component for the authentication form.
 *
 * @returns  {Object}  the rendered component
 */
const AuthenticationForm = ({
  initialValues, isAuthenticating, onCancel, onSubmit
}) => (
  <Form initialValues={initialValues} onSubmit={onSubmit}>
    {({ handleSubmit }) => (
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Field component={TextField} autoFocus
            name='username' label='Username' fullWidth
            autoComplete='username' />
          <Field component={PasswordField}
            name='password' label='Password' fullWidth
            autoComplete='current-password' />
        </DialogContent>
        <DialogActions>
          <Button disabled={isAuthenticating} color="primary" type="submit">
            {isAuthenticating ? 'Logging in...' : 'Log in'}
          </Button>
          <Button onClick={onCancel}>Cancel</Button>
        </DialogActions>
      </form>
    )}
  </Form>
)

AuthenticationForm.propTypes = {
  initialValues: PropTypes.object,
  isAuthenticating: PropTypes.bool,
  lastError: PropTypes.string,
  onCancel: PropTypes.func,
  onSubmit: PropTypes.func
}

/**
 * Presentation component for the authentication dialog.
 *
 * @returns  {Object}  the rendered component
 */
const AuthenticationDialogPresentation = ({ open, title, ...rest }) => (
  <Dialog maxWidth='xs' open={open}>
    <DialogTitle>{title}</DialogTitle>
    <AuthenticationForm {...rest} />
  </Dialog>
)

AuthenticationDialogPresentation.propTypes = {
  isAuthenticating: PropTypes.bool.isRequired,
  lastError: PropTypes.string,
  onCancel: PropTypes.func,
  onSubmit: PropTypes.func,
  open: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired
}

/**
 * Authentication dialog.
 */
const AuthenticationDialog = connect(
  // mapStateToProps
  state => ({
    ...state.dialogs.authentication,
    isAuthenticating: isAuthenticating(state),
    title: requiresAuthentication(state) ? 'Authentication required' : 'Authenticate to server'
  }),
  // mapDispatchToProps
  dispatch => ({
    onCancel () {
      dispatch(closeAuthenticationDialog())
    },

    onSubmit (data) {
      dispatch(authenticateToServer({ ...data, messageHub }))
    }
  })
)(AuthenticationDialogPresentation)

export default AuthenticationDialog
