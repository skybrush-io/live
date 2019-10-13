import PersonIcon from '@material-ui/icons/Person';

import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import AuthenticationStatusBadge from '../badges/AuthenticationStatusBadge';

import {
  showAuthenticationDialog,
  showDeauthenticationDialog
} from '~/actions/servers';
import {
  isAuthenticated,
  requiresAuthentication,
  supportsAuthentication
} from '~/selectors/servers';

const AuthenticationButtonPresentation = ({
  isAuthenticated,
  isDisabled,
  label,
  onAuthenticate,
  onDeauthenticate
}) => (
  <div
    className={clsx('wb-module', { 'wb-module-disabled': isDisabled })}
    onClick={isAuthenticated ? onDeauthenticate : onAuthenticate}
  >
    <span className={clsx('wb-icon', 'wb-module-icon')}>
      <AuthenticationStatusBadge />
      <PersonIcon />
    </span>
    {label ? <span className="wb-label wb-module-label">{label}</span> : null}
  </div>
);

AuthenticationButtonPresentation.propTypes = {
  isAuthenticated: PropTypes.bool,
  isDisabled: PropTypes.bool,
  label: PropTypes.string,
  onAuthenticate: PropTypes.func,
  onDeauthenticate: PropTypes.func
};

export default connect(
  // mapStateToProps
  state => ({
    isAuthenticated: isAuthenticated(state),
    isAuthRequired: requiresAuthentication(state),
    isDisabled: !supportsAuthentication(state)
  }),
  // mapDispatchToProps
  dispatch => ({
    onAuthenticate: () => dispatch(showAuthenticationDialog()),
    onDeauthenticate: () => dispatch(showDeauthenticationDialog())
  })
)(AuthenticationButtonPresentation);
