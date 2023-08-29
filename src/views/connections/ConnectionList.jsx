/**
 * @file Component that shows the list of connections managed by the
 * current server.
 */

import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';

import { green, grey, red, yellow } from '@material-ui/core/colors';

import ActionDone from '@material-ui/icons/Done';
import ActionHelpOutline from '@material-ui/icons/HelpOutline';
import ActionSettings from '@material-ui/icons/Settings';
import ActionSettingsEthernet from '@material-ui/icons/SettingsEthernet';
import ContentClear from '@material-ui/icons/Clear';

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import TimeAgo from 'react-timeago';

import { listOf } from '~/components/helpers/lists';
import { showServerSettingsDialog } from '~/features/servers/actions';
import { ConnectionState } from '~/model/enums';
import { getConnectionsInOrder } from '~/selectors/ordered';

/**
 * Icons for the different connection states in the connection list.
 */
const iconsByState = {
  [ConnectionState.CONNECTED]: (
    <ListItemIcon style={{ color: green[500] }}>
      <ActionDone />
    </ListItemIcon>
  ),
  [ConnectionState.CONNECTING]: (
    <ListItemIcon style={{ color: yellow[700] }}>
      <ActionSettingsEthernet />
    </ListItemIcon>
  ),
  [ConnectionState.DISCONNECTED]: (
    <ListItemIcon style={{ color: red.A700 }}>
      <ContentClear />
    </ListItemIcon>
  ),
  [ConnectionState.DISCONNECTING]: (
    <ListItemIcon style={{ color: yellow[700] }}>
      <ActionSettingsEthernet />
    </ListItemIcon>
  ),
};

/**
 * Icon styling for unknown or unsupported connection states in the
 * connection list.
 */
const avatarForUnknownState = (
  <ListItemIcon style={{ color: grey[500] }}>
    <ActionHelpOutline />
  </ListItemIcon>
);

/**
 * Textual description of each supported connection state.
 */
const stateNames = {
  [ConnectionState.CONNECTED]: 'Connected',
  [ConnectionState.CONNECTING]: 'Connecting',
  [ConnectionState.DISCONNECTED]: 'Disconnected',
  [ConnectionState.DISCONNECTING]: 'Disconnecting',
};

/**
 * Presentation component for a single entry in the connection list.
 *
 * @param  {Object} props  the properties of the component
 * @return {Object} the React presentation component
 */
const ConnectionListEntry = (props) => {
  const { action, name, state, stateChangedAt } = props;
  const avatar = iconsByState[state] || avatarForUnknownState;
  const timeAgoComponent = stateChangedAt ? (
    <TimeAgo date={stateChangedAt} />
  ) : null;
  const actionButton = action ? (
    <IconButton edge='end' onClick={action}>
      <ActionSettings />
    </IconButton>
  ) : null;
  let secondaryText = stateNames[state] || 'Unknown state';

  if (timeAgoComponent) {
    secondaryText = (
      <span>
        {secondaryText} {timeAgoComponent}
      </span>
    );
  }

  return (
    <ListItem>
      {avatar}
      <ListItemText primary={name} secondary={secondaryText} />
      <ListItemSecondaryAction>{actionButton}</ListItemSecondaryAction>
    </ListItem>
  );
};

ConnectionListEntry.propTypes = {
  name: PropTypes.string.isRequired,
  state: PropTypes.string.isRequired,
  stateChangedAt: PropTypes.number,
  action: PropTypes.func,
};

/**
 * Presentation component for the entire connection list.
 */
export const ConnectionListPresentation = listOf(
  (connection) => {
    return <ConnectionListEntry key={connection.id} {...connection} />;
  },
  {
    dataProvider: 'connections',
    backgroundHint: 'No connections',
  }
);
ConnectionListPresentation.displayName = 'ConnectionListPresentation';

const ConnectionList = connect(
  // mapStateToProps
  (state) => ({
    connections: getConnectionsInOrder(state),
  }),
  // mapDispatchToProps
  (dispatch) => ({
    onShowSettings() {
      dispatch(showServerSettingsDialog());
    },
  })
)(ConnectionListPresentation);

export default ConnectionList;
