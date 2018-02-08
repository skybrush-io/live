import { green500 } from 'material-ui/colors'
import ConnectionIcon from 'material-ui-icons/Power'

import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import { Badge } from './Badge'

import { showServerSettingsDialog } from '../actions/server-settings'
import { ConnectionState, MASTER_CONNECTION_ID } from '../model/connections'

const badgeColorForState = {
  [ConnectionState.CONNECTED]: '#0c0',
  [ConnectionState.CONNECTING]: '#fc0',
  [ConnectionState.DISCONNECTING]: '#fc0'
}

const ConnectionSettingsButtonPresentation = ({ onClick, state }) => {
  const classes = ['wb-module']
  return (
    <div className={classes.join(' ')} onClick={onClick}>
      <span className='wb-icon wb-module-icon' style={{ position: 'relative' }}>
        <Badge visible={state !== ConnectionState.DISCONNECTED}
          color={badgeColorForState[state]} offset={[8, 8]} />
        <ConnectionIcon onClick={onClick} />
      </span>
      Server Settings
    </div>
  )
}

ConnectionSettingsButtonPresentation.propTypes = {
  onClick: PropTypes.func,
  state: PropTypes.string
}

export default connect(
  // mapStateToProps
  state => ({
    state: state.connections.byId[MASTER_CONNECTION_ID].state
  }),
  // mapDispatchToProps
  dispatch => ({
    onClick () {
      dispatch(showServerSettingsDialog())
    }
  })
)(ConnectionSettingsButtonPresentation)
