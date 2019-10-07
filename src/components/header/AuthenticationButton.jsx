import PersonIcon from '@material-ui/icons/Person'

import classNames from 'classnames'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import SidebarBadge from '../sidebar/SidebarBadge'

import {
  requiresAuthentication,
  supportsAuthentication
} from '~/selectors/servers'

const badgeColorForState = {
  authenticated: '#0c0',
  authenticating: '#fc0',
  notAuthenticated: '#f00',
  authenticationNotRequired: undefined
}

const AuthenticationButtonPresentation = ({
  authRequired, disabled, onClick, showLabel, state
}) => (
  <div className={classNames('wb-module', { 'wb-module-disabled': disabled })} onClick={onClick}>
    <span className={classNames('wb-icon', 'wb-module-icon')}>
      <SidebarBadge visible={authRequired} color={badgeColorForState[state]} />
      <PersonIcon />
    </span>
    {showLabel ? <span className='wb-label wb-module-label'>Authentication</span> : null}
  </div>
)

AuthenticationButtonPresentation.propTypes = {
  authRequired: PropTypes.bool,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  showLabel: PropTypes.bool,
  state: PropTypes.string
}

export default connect(
  // mapStateToProps
  state => ({
    authRequired: requiresAuthentication(state),
    disabled: !supportsAuthentication(state),
    state: (
      requiresAuthentication(state)
        ? 'notAuthenticated'
        : 'authenticationNotRequired'
    )
  })
)(AuthenticationButtonPresentation)
