import ConnectionIcon from '@material-ui/icons/Power'

import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import SidebarBadge from './SidebarBadge'

import { showServerSettingsDialog } from '../../actions/server-settings'
import { ConnectionState, MASTER_CONNECTION_ID } from '../../model/connections'

const badgeColorForState = {
  [ConnectionState.CONNECTED]: '#0c0',
  [ConnectionState.CONNECTING]: '#fc0',
  [ConnectionState.DISCONNECTING]: '#fc0',
  [ConnectionState.DISCONNECTED]: '#f00'
}

const ConnectionSettingsButtonPresentation = ({ active, onClick, showLabel, state }) => {
  const classes = ['wb-module']
  return (
    <div className={classes.join(' ')} onClick={onClick}>
      <span className='wb-icon wb-module-icon'>
        <SidebarBadge visible={active} color={badgeColorForState[state]} />
        <ConnectionIcon />
      </span>
      {showLabel ? <span className='wb-label wb-module-label'>Server settings</span> : null}
    </div>
  )
}

ConnectionSettingsButtonPresentation.propTypes = {
  active: PropTypes.bool,
  onClick: PropTypes.func,
  showLabel: PropTypes.bool,
  state: PropTypes.string
}

export default connect(
  // mapStateToProps
  state => ({
    active: state.dialogs.serverSettings.active,
    state: state.connections.byId[MASTER_CONNECTION_ID].state
  }),
  // mapDispatchToProps
  dispatch => ({
    onClick () {
      dispatch(showServerSettingsDialog())
    }
  })
)(ConnectionSettingsButtonPresentation)
