/**
 * @file The authentication dialog that appears on top of the main window when
 * the user needs to (or tries to) authenticate to the current server.
 */

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { makeStyles } from '@material-ui/core/styles';

import PropTypes from 'prop-types';
import React from 'react';
import { Form, Field } from 'react-final-form';
import { connect } from 'react-redux';

import { closeAuthenticationDialog } from '~/actions/servers';
import { PasswordField, TextField } from '~/components/forms';
import { authenticateToServerWithBasicAuthentication } from '~/features/servers/actions';
import {
  isAuthenticating,
  requiresAuthentication,
} from '~/features/servers/selectors';
import messageHub from '~/message-hub';

const useStyles = makeStyles(
  (theme) => ({
    root: {
      marginBottom: 0,

      '& .MuiDialogContent-root': {
        paddingTop: 0,
      },

      '& .MuiTextField-root': {
        marginBottom: theme.spacing(1),
      },
    },
  }),
  { name: 'AuthenticationForm' }
);

/**
 * Presentation component for the authentication form.
 *
 * @returns  {Object}  the rendered component
 */
const AuthenticationForm = ({
  initialValues,
  isAuthenticating,
  onCancel,
  onSubmit,
}) => {
  const classes = useStyles();

  return (
    <Form initialValues={initialValues} onSubmit={onSubmit}>
      {({ handleSubmit }) => (
        <form className={classes.root} onSubmit={handleSubmit}>
          <DialogContent>
            <Field
              autoFocus
              fullWidth
              component={TextField}
              name='username'
              label='Username'
              autoComplete='username'
            />
            <Field
              fullWidth
              component={PasswordField}
              name='password'
              label='Password'
              autoComplete='current-password'
            />
          </DialogContent>
          <DialogActions>
            <Button disabled={isAuthenticating} color='primary' type='submit'>
              {isAuthenticating ? 'Logging in…' : 'Log in'}
            </Button>
            <Button onClick={onCancel}>Cancel</Button>
          </DialogActions>
        </form>
      )}
    </Form>
  );
};

AuthenticationForm.propTypes = {
  initialValues: PropTypes.object,
  isAuthenticating: PropTypes.bool,
  onCancel: PropTypes.func,
  onSubmit: PropTypes.func,
};

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
);

AuthenticationDialogPresentation.propTypes = {
  isAuthenticating: PropTypes.bool.isRequired,
  lastError: PropTypes.string,
  onCancel: PropTypes.func,
  onSubmit: PropTypes.func,
  open: PropTypes.bool,
  title: PropTypes.string.isRequired,
};

AuthenticationDialogPresentation.defaultProps = {
  open: false,
};

/**
 * Authentication dialog.
 */
const AuthenticationDialog = connect(
  // mapStateToProps
  (state) => ({
    ...state.dialogs.authentication,
    isAuthenticating: isAuthenticating(state),
    title: requiresAuthentication(state)
      ? 'Authentication required'
      : 'Authenticate to server',
  }),
  // mapDispatchToProps
  (dispatch) => ({
    onCancel() {
      dispatch(closeAuthenticationDialog());
    },

    async onSubmit(data) {
      const response = await dispatch(
        authenticateToServerWithBasicAuthentication({ ...data, messageHub })
      );
      const success = response && response.value && response.value.result;
      if (success) {
        dispatch(closeAuthenticationDialog());
      }
    },
  })
)(AuthenticationDialogPresentation);

export default AuthenticationDialog;
