import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import PersonIcon from '@material-ui/icons/Person';

import Tooltip from '@skybrush/mui-components/lib/Tooltip';

import AuthenticationStatusBadge from '../badges/AuthenticationStatusBadge';

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
  label,
  onAuthenticate,
  onDeauthenticate,
  t,
}) => (
  <Tooltip content={t('authentication')}>
    <div
      className={clsx('wb-module', isDisabled && 'wb-module-disabled')}
      onClick={
        isDisabled ? null : isAuthenticated ? onDeauthenticate : onAuthenticate
      }
    >
      <span className={clsx('wb-icon', 'wb-module-icon')}>
        <AuthenticationStatusBadge />
        <PersonIcon />
      </span>
      {label ? <span className='wb-label wb-module-label'>{label}</span> : null}
    </div>
  </Tooltip>
);

AuthenticationButtonPresentation.propTypes = {
  isAuthenticated: PropTypes.bool,
  isDisabled: PropTypes.bool,
  label: PropTypes.string,
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
