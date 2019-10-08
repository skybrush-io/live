import PersonIcon from '@material-ui/icons/Person';

import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import SidebarBadge from '../sidebar/SidebarBadge';

import {
  showAuthenticationDialog,
  showDeauthenticationDialog
} from '~/actions/servers';
import {
  isAuthenticated,
  isAuthenticating,
  requiresAuthentication,
  supportsAuthentication
} from '~/selectors/servers';

const badgeColorForState = {
  authenticated: '#0c0',
  authenticating: '#fc0',
  notAuthenticated: '#f00',
  authenticationNotRequired: undefined
};

const AuthenticationButtonPresentation = ({
  authRequired,
  disabled,
  label,
  onAuthenticate,
  onDeauthenticate,
  state
}) => (
  <div
    className={clsx('wb-module', { 'wb-module-disabled': disabled })}
    onClick={state !== 'authenticated' ? onAuthenticate : onDeauthenticate}
  >
    <span className={clsx('wb-icon', 'wb-module-icon')}>
      <SidebarBadge
        visible={badgeColorForState[state] !== undefined}
        color={badgeColorForState[state]}
      />
      <PersonIcon />
    </span>
    {label ? <span className="wb-label wb-module-label">{label}</span> : null}
  </div>
);

AuthenticationButtonPresentation.propTypes = {
  authRequired: PropTypes.bool,
  disabled: PropTypes.bool,
  label: PropTypes.string,
  onAuthenticate: PropTypes.func,
  onDeauthenticate: PropTypes.func,
  state: PropTypes.string
};

export default connect(
  // MapStateToProps
  state => ({
    authRequired: requiresAuthentication(state),
    disabled: !supportsAuthentication(state),
    state: isAuthenticated(state)
      ? 'authenticated'
      : isAuthenticating(state)
      ? 'authenticating'
      : requiresAuthentication(state)
      ? 'notAuthenticated'
      : 'authenticationNotRequired'
  }),
  // MapDispatchToProps
  dispatch => ({
    onAuthenticate: () => dispatch(showAuthenticationDialog()),
    onDeauthenticate: () => dispatch(showDeauthenticationDialog())
  })
)(AuthenticationButtonPresentation);
