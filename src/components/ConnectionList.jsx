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
import TimeAgo from 'react-timeago'

import { showServerSettingsDialog } from '../actions/server-settings'
import { ConnectionState, MASTER_CONNECTION_ID } from '../model/connections'
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
 * Custom formatter of secondary text for a ConnectionListEntry
 *
 * @param  {number} value  the value to format
 * @param  {string} unit   the unit of the value (e.g., second)
 * @return {string} the formattted secondary text
 */
function timeIntervalFormatter (value, unit) {
  const plural = (value > 1) ? 's' : ''
  return `for ${value} ${unit}${plural}`
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
    ? <TimeAgo date={stateChangedAt} formatter={timeIntervalFormatter} />
    : null
  const actionButton = action
    ? <IconButton onClick={action}><ActionSettings /></IconButton>
    : null
  let secondaryText = stateNames[state] || 'Unknown state'

  if (timeAgoComponent) {
    secondaryText = <div>{secondaryText} {timeAgoComponent}</div>
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
export const ConnectionListPresentation = listOf((connection, { onShowSettings }) => {
  const action = (connection.id === MASTER_CONNECTION_ID) ? onShowSettings : null
  return <ConnectionListEntry key={connection.id} action={action} {...connection} />
}, {
  dataProvider: 'connections',
  backgroundHint: 'No connections'
})
ConnectionListPresentation.displayName = 'ConnectionListPresentation'

const ConnectionList = connect(
  // mapStateToProps
  state => ({
    connections: state.connections.order.map(
      entryName => state.connections.items[entryName]
    )
  }),
  // mapDispatchToProps
  dispatch => ({
    onShowSettings () {
      dispatch(showServerSettingsDialog())
    }
  })
)(ConnectionListPresentation)

export default ConnectionList
