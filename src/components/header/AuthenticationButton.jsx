import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import PersonIcon from '@material-ui/icons/Person';

import GenericHeaderButton from '@skybrush/mui-components/lib/GenericHeaderButton';

import AuthenticationStatusBadge from '~/components/badges/AuthenticationStatusBadge';
import {
  showAuthenticationDialog,
  showDeauthenticationDialog,
} from '~/features/servers/actions';
import {
  isAuthenticated,
  requiresAuthentication,
  supportsAuthentication,
} from '~/features/servers/selectors';

const AuthenticationButtonPresentation = ({
  isAuthenticated,
  isDisabled,
  onAuthenticate,
  onDeauthenticate,
  t,
}) => (
  <GenericHeaderButton
    tooltip={t('authentication')}
    disabled={isDisabled}
    onClick={
      isDisabled ? null : isAuthenticated ? onDeauthenticate : onAuthenticate
    }
  >
    <AuthenticationStatusBadge />
    <PersonIcon />
  </GenericHeaderButton>
);

AuthenticationButtonPresentation.propTypes = {
  isAuthenticated: PropTypes.bool,
  isDisabled: PropTypes.bool,
  onAuthenticate: PropTypes.func,
  onDeauthenticate: PropTypes.func,
  t: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    isAuthenticated: isAuthenticated(state),
    isAuthRequired: requiresAuthentication(state),
    isDisabled: !supportsAuthentication(state),
  }),
  // mapDispatchToProps
  (dispatch) => ({
    onAuthenticate: () => dispatch(showAuthenticationDialog()),
    onDeauthenticate: () => dispatch(showDeauthenticationDialog()),
  })
)(withTranslation()(AuthenticationButtonPresentation));
