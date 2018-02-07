/**
 * @file Component that shows the list of connections managed by the current
 * server as well as the master connection to the server itself.
 */

import Avatar from 'material-ui/Avatar'
import IconButton from 'material-ui/IconButton'
import { ListItem, ListItemSecondaryAction, ListItemText } from 'material-ui/List'

import { common, green, grey, red, yellow } from 'material-ui/colors'

import ActionDone from 'material-ui-icons/Done'
import ActionHelpOutline from 'material-ui-icons/HelpOutline'
import ActionSettings from 'material-ui-icons/Settings'
import ActionSettingsEthernet from 'material-ui-icons/SettingsEthernet'
import ContentClear from 'material-ui-icons/Clear'

import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'
import { TimeAgo } from 'react-time-ago'

import { showServerSettingsDialog } from '../actions/server-settings'
import { ConnectionState } from '../model/connections'
import { getConnectionsInOrder } from '../selectors'

import { listOf } from './helpers/lists'

/**
 * Avatars for the different connection states in the connection list.
 */
const avatarsByState = {
  [ConnectionState.CONNECTED]: (
    <Avatar style={{
      backgroundColor: common.white,
      color: green[500]
    }}>
      <ActionDone />
    </Avatar>
  ),
  [ConnectionState.CONNECTING]: (
    <Avatar style={{
      backgroundColor: yellow[500],
      color: common.black
    }}>
      <ActionSettingsEthernet />
    </Avatar>
  ),
  [ConnectionState.DISCONNECTED]: (
    <Avatar style={{
      backgroundColor: red['A700'],
      color: common.white
    }}>
      <ContentClear />
    </Avatar>
  ),
  [ConnectionState.DISCONNECTING]: (
    <Avatar style={{
      backgroundColor: yellow[500],
      color: common.black
    }}>
      <ActionSettingsEthernet />
    </Avatar>
  )
}

/**
 * Avatar styling for unknown or unsupported connection states in the
 * connection list.
 */
const avatarForUnknownState = (
  <Avatar style={{
    backgroundColor: grey[500],
    color: common.white
  }}>
    <ActionHelpOutline />
  </Avatar>
)

/**
 * Textual description of each supported connection state.
 */
const stateNames = {
  [ConnectionState.CONNECTED]: 'Connected',
  [ConnectionState.CONNECTING]: 'Connecting',
  [ConnectionState.DISCONNECTED]: 'Disconnected',
  [ConnectionState.DISCONNECTING]: 'Disconnecting'
}

/**
 * Presentation component for a single entry in the connection list.
 *
 * @param  {Object} props  the properties of the component
 * @return {Object} the React presentation component
 */
const ConnectionListEntry = (props) => {
  const { action, name, state, stateChangedAt } = props
  const avatar = avatarsByState[state] || avatarForUnknownState
  const timeAgoComponent = stateChangedAt
    ? <TimeAgo>{stateChangedAt}</TimeAgo>
    : null
  const actionButton = action
    ? <IconButton onClick={action}><ActionSettings /></IconButton>
    : null
  let secondaryText = stateNames[state] || 'Unknown state'

  if (timeAgoComponent) {
    secondaryText = <span>{secondaryText} {timeAgoComponent}</span>
  }

  return (
    <ListItem>
      {avatar}
      <ListItemText primary={name} secondary={secondaryText} />
      <ListItemSecondaryAction>{actionButton}</ListItemSecondaryAction>
    </ListItem>
  )
}

ConnectionListEntry.propTypes = {
  name: PropTypes.string.isRequired,
  state: PropTypes.string.isRequired,
  stateChangedAt: PropTypes.instanceOf(Date),
  action: PropTypes.func
}

/**
 * Presentation component for the entire connection list.
 */
export const ConnectionListPresentation = listOf(connection => {
  return <ConnectionListEntry key={connection.id} {...connection} />
}, {
  dataProvider: 'connections',
  backgroundHint: 'No connections'
})
ConnectionListPresentation.displayName = 'ConnectionListPresentation'

const ConnectionList = connect(
  // mapStateToProps
  state => ({
    connections: getConnectionsInOrder(state)
  }),
  // mapDispatchToProps
  dispatch => ({
    onShowSettings () {
      dispatch(showServerSettingsDialog())
    }
  })
)(ConnectionListPresentation)

export default ConnectionList
