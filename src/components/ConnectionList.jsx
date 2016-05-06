/**
 * @file Component that shows the list of connections managed by the current
 * server as well as the master connection to the server itself.
 */

import Avatar from 'material-ui/Avatar'
import IconButton from 'material-ui/IconButton'
import { List, ListItem } from 'material-ui/List'
import Subheader from 'material-ui/Subheader'

import { colors } from 'material-ui/styles'

import ActionDone from 'material-ui/svg-icons/action/done'
import ActionHelpOutline from 'material-ui/svg-icons/action/help-outline'
import ActionSettings from 'material-ui/svg-icons/action/settings'
import ActionSettingsEthernet from 'material-ui/svg-icons/action/settings-ethernet'
import ContentClear from 'material-ui/svg-icons/content/clear'

import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import TimeAgo from 'react-timeago'

import { showServerSettingsDialog } from '../actions/server-settings'
import { ConnectionState, MASTER_CONNECTION_ID } from '../connections'

/**
 * Avatar styling constants for the different connection states in the
 * connection list.
 */
const entryStylesByState = {
  [ConnectionState.CONNECTED]: {
    backgroundColor: colors.white,
    color: colors.green500,
    icon: <ActionDone/>
  },
  [ConnectionState.CONNECTING]: {
    backgroundColor: colors.yellow500,
    color: colors.black,
    icon: <ActionSettingsEthernet/>
  },
  [ConnectionState.DISCONNECTED]: {
    backgroundColor: colors.redA700,
    color: colors.white,
    icon: <ContentClear/>
  },
  [ConnectionState.DISCONNECTING]: {
    backgroundColor: colors.yellow500,
    color: colors.black,
    icon: <ActionSettingsEthernet/>
  }
}

/**
 * Avatar styling for unknown or unsupported connection states in the
 * connection list.
 */
const entryStyleForUnknownState = {
  backgroundColor: colors.grey500,
  color: colors.white,
  icon: <ActionHelpOutline/>
}

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
 */
function timeIntervalFormatter (value, unit, suffix, date) {
  const plural = (value > 1) ? 's' : ''
  return `for ${value} ${unit}${plural}`
}

/**
 * Presentation component for a single entry in the connection list.
 */
const ConnectionListEntry = (props) => {
  const { action, name, state, stateChangedAt } = props
  const style = entryStylesByState[state] || entryStyleForUnknownState
  const timeAgoComponent = stateChangedAt
    ? <TimeAgo date={stateChangedAt} formatter={timeIntervalFormatter} />
    : null
  const actionButton = action
    ? <IconButton onTouchTap={action}><ActionSettings/></IconButton>
    : null
  let secondaryText = stateNames[state] || 'Unknown state'

  if (timeAgoComponent) {
    secondaryText = <div>{secondaryText} {timeAgoComponent}</div>
  }

  return (
    <ListItem leftAvatar={<Avatar {...style}/>}
              primaryText={name}
              secondaryText={secondaryText}
              rightIconButton={actionButton}
              />
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
const ConnectionListPresentation = ({ connections, onShowSettings }) => {
  const entries = [<Subheader key="__subheader__" text="Connections" />]
  for (let connection of connections) {
    let action = (connection.id === MASTER_CONNECTION_ID) ? onShowSettings : null
    entries.push(<ConnectionListEntry key={connection.id} action={action} {...connection} />)
  }
  return <List>{entries}</List>
}

ConnectionListPresentation.propTypes = {
  connections: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    state: PropTypes.string.isRequired,
    stateChangedAt: PropTypes.instanceOf(Date)
  })),
  onShowSettings: PropTypes.func
}

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
