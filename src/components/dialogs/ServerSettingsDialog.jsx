/**
 * @file Dialog that shows the server settings and allows the user to
 * edit it.
 */

import config from 'config';

import partial from 'lodash-es/partial';
import { Switches, TextField } from 'mui-rff';
import PropTypes from 'prop-types';
import React from 'react';
import { Form } from 'react-final-form';
import { connect } from 'react-redux';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import CircularProgress from '@material-ui/core/CircularProgress';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';

import Computer from '@material-ui/icons/Computer';
import EditIcon from '@material-ui/icons/Edit';
import SignalWifi0Bar from '@material-ui/icons/SignalWifi0Bar';
import WifiIcon from '@material-ui/icons/Wifi';

import DialogTabs from '@skybrush/mui-components/lib/DialogTabs';
import SmallProgressIndicator from '@skybrush/mui-components/lib/SmallProgressIndicator';

import {
  ServerDetectionManager,
  isServerDetectionSupported,
} from '../ServerDetectionManager';

import { forceFormSubmission } from '~/components/forms';
import {
  closeServerSettingsDialog,
  disconnectFromServer,
  setServerSettingsDialogTab,
} from '~/features/servers/actions';
import {
  getDetectedServersInOrder,
  getServerHostname,
  getServerProtocolWithDefaultWS,
  isConnecting,
} from '~/features/servers/selectors';
import { isTCPConnectionSupported } from '~/features/servers/server-settings-dialog';
import { Protocol } from '~/features/servers/types';
import {
  createValidator,
  between,
  integer,
  required,
} from '~/utils/validation';

const iconForServerItem = ({ hostName, type }) =>
  type === 'inferred' ? (
    <SignalWifi0Bar />
  ) : hostName === 'localhost' ? (
    <Computer />
  ) : (
    <WifiIcon />
  );

const isItemSecure = ({ protocol }) => protocol === 'sio+tls:';
const isItemLocal = ({ hostName }) => hostName === 'localhost';
const addressForServerItem = ({ hostName, port }) => `${hostName}:${port}`;

const protocolForServerItem = (item) =>
  isItemSecure(item)
    ? 'Secure connection'
    : isItemLocal(item)
    ? 'Local connection'
    : 'Unsecured connection';
const securityWarningForServerItem = (item) =>
  isItemSecure(item) || isItemLocal(item) ? '' : ' (unsecured)';

const primaryTextForServerItem = (item) =>
  item.label || addressForServerItem(item);

const secondaryTextForServerItem = (item) =>
  item.label
    ? `${addressForServerItem(item)}${securityWarningForServerItem(item)}`
    : protocolForServerItem(item);

const manualSetupAllowed = !config?.server?.preventManualSetup;

const ConnectionInProgressIndicator = ({ hostName, ...rest }) => (
  <SmallProgressIndicator
    label={hostName ? `Connecting to ${hostName}...` : 'Connecting...'}
    {...rest}
  />
);

ConnectionInProgressIndicator.propTypes = {
  hostName: PropTypes.string,
};

const DetectedServersListPresentation = ({
  isScanning,
  items,
  onItemSelected,
}) => (
  <List disablePadding style={{ height: 160, overflow: 'auto' }}>
    {isScanning && (!items || items.length === 0) ? (
      <ListItem key='__scanning'>
        <ListItemIcon>
          <CircularProgress color='secondary' size={24} />
        </ListItemIcon>
        <ListItemText
          primary='Please wait…'
          secondary='Scanning network for servers…'
        />
      </ListItem>
    ) : null}
    {items.map((item) => (
      <ListItem key={item.id} button onClick={partial(onItemSelected, item)}>
        <ListItemIcon>{iconForServerItem(item)}</ListItemIcon>
        <ListItemText
          primary={primaryTextForServerItem(item)}
          secondary={secondaryTextForServerItem(item)}
        />
      </ListItem>
    ))}
    {manualSetupAllowed && (
      <ListItem key='__manual' button onClick={partial(onItemSelected, null)}>
        <ListItemIcon>
          <EditIcon />
        </ListItemIcon>
        <ListItemText primary='Enter manually' />
      </ListItem>
    )}
  </List>
);

DetectedServersListPresentation.propTypes = {
  isScanning: PropTypes.bool,
  items: PropTypes.array,
  onItemSelected: PropTypes.func,
};

/**
 * Container of the list that shows the running servers that we have
 * detected on the network.
 */
const DetectedServersList = connect(
  // mapStateToProps
  (state) => ({
    isScanning: state.servers.isScanning,
    items: getDetectedServersInOrder(state),
  })
)(DetectedServersListPresentation);

const validator = createValidator({
  hostName: required,
  port: [required, integer, between(1, 65535)],
});

const ServerSettingsFormPresentation = ({
  initialValues,
  onKeyPress,
  onSubmit,
}) => (
  <Form initialValues={initialValues} validate={validator} onSubmit={onSubmit}>
    {({ handleSubmit }) => (
      <form id='serverSettings' onSubmit={handleSubmit} onKeyPress={onKeyPress}>
        <TextField
          fullWidth
          name='hostName'
          label='Hostname'
          variant='filled'
          margin='normal'
        />
        <TextField
          fullWidth
          name='port'
          label='Port'
          variant='filled'
          margin='normal'
        />
        <Switches name='isSecure' data={{ label: 'Use secure connection' }} />
        {isTCPConnectionSupported ? (
          <Switches
            name='isWebSocket'
            data={{
              label: 'Use WebSocket protocol instead of TCP',
            }}
            helperText='For backwards compatibility only.'
          />
        ) : null}
      </form>
    )}
  </Form>
);

ServerSettingsFormPresentation.propTypes = {
  initialValues: PropTypes.object,
  onKeyPress: PropTypes.func,
  onSubmit: PropTypes.func,
};

/**
 * Container of the form that shows the fields that the user can use to
 * edit the server settings.
 */
const ServerSettingsForm = connect(
  // mapStateToProps
  (state) => ({
    initialValues: {
      ...state.dialogs.serverSettings,
      isWebSocket: getServerProtocolWithDefaultWS(state) === Protocol.WS,
    },
  })
)(ServerSettingsFormPresentation);

/**
 * Presentation component for the dialog that shows the form that the user
 * can use to edit the server settings.
 */
class ServerSettingsDialogPresentation extends React.Component {
  static propTypes = {
    active: PropTypes.bool,
    forceFormSubmission: PropTypes.func,
    hostName: PropTypes.string,
    isConnecting: PropTypes.bool,
    onClose: PropTypes.func,
    onDisconnect: PropTypes.func,
    onSubmit: PropTypes.func,
    onTabSelected: PropTypes.func,
    open: PropTypes.bool.isRequired,
    selectedTab: PropTypes.string,
  };

  static defaultProps = {
    selectedTab: 'auto',
  };

  _handleKeyPress = (event) => {
    if (event.nativeEvent.code === 'Enter') {
      this.props.forceFormSubmission();
    }
  };

  _handleServerSelection = (item) => {
    if (item === null || item === undefined) {
      if (manualSetupAllowed) {
        this.props.onTabSelected(null, 'manual');
      }
    } else {
      this.props.onSubmit({
        ...item,
        isSecure: item.protocol.endsWith('+tls:'),
      });
    }
  };

  render() {
    const {
      active,
      forceFormSubmission,
      hostName,
      isConnecting,
      onClose,
      onDisconnect,
      onSubmit,
      onTabSelected,
      open,
      selectedTab,
    } = this.props;
    const actions = [];
    const content = [];

    actions.push(
      <ConnectionInProgressIndicator
        key='__connectionIndicator'
        hostName={hostName}
        visible={isConnecting}
      />
    );

    switch (selectedTab) {
      case 'auto':
        content.push(
          <DetectedServersList
            key='serverList'
            onItemSelected={this._handleServerSelection}
          />
        );

        if (manualSetupAllowed) {
          if (!isServerDetectionSupported) {
            content.push(
              <DialogContent key='contents'>
                <Typography variant='body2' color='textSecondary'>
                  Auto-discovery is not available in this version.
                </Typography>
              </DialogContent>
            );
          }
        } else {
          content.push(
            <DialogContent key='contents'>
              <Typography variant='body2' color='textSecondary'>
                Connecting to other servers is not supported in this version.
              </Typography>
            </DialogContent>
          );
        }

        break;

      case 'manual':
        if (manualSetupAllowed) {
          content.push(
            <DialogContent key='contents'>
              <ServerSettingsForm
                onSubmit={onSubmit}
                onKeyPress={this._handleKeyPress}
              />
            </DialogContent>
          );
          actions.push(
            <Button key='connect' color='primary' onClick={forceFormSubmission}>
              Connect
            </Button>
          );
        }

        break;

      default:
        break;
    }

    if (manualSetupAllowed) {
      actions.push(
        <Button
          key='disconnect'
          disabled={!active}
          onClick={active ? onDisconnect : undefined}
        >
          Disconnect
        </Button>
      );
    }

    actions.push(
      <Button key='close' onClick={onClose}>
        Close
      </Button>
    );

    return (
      <Dialog fullWidth open={open} maxWidth='xs' onClose={onClose}>
        <DialogTabs value={selectedTab} onChange={onTabSelected}>
          <Tab
            value='auto'
            label={
              !manualSetupAllowed ? 'Preconfigured server' : 'Autodetected'
            }
          />
          {manualSetupAllowed && <Tab value='manual' label='Manual' />}
        </DialogTabs>
        <ServerDetectionManager />
        {content}
        <DialogActions>{actions}</DialogActions>
      </Dialog>
    );
  }
}

/**
 * Container of the dialog that shows the form that the user can use to
 * edit the server settings.
 */
const ServerSettingsDialog = connect(
  // mapStateToProps
  (state) => ({
    active: state.dialogs.serverSettings.active,
    hostName: getServerHostname(state),
    isConnecting: isConnecting(state),
    open: state.dialogs.serverSettings.dialogVisible,
    selectedTab: state.dialogs.serverSettings.selectedTab,
  }),
  // mapDispatchToProps
  (dispatch) => ({
    forceFormSubmission() {
      forceFormSubmission('serverSettings');
    },
    onClose() {
      dispatch(closeServerSettingsDialog());
    },
    onDisconnect() {
      // dispatch(closeServerSettingsDialog());
      dispatch(disconnectFromServer());
    },
    onSubmit(data) {
      dispatch(
        closeServerSettingsDialog({
          active: true,
          hostName: data.hostName,
          isSecure: data.isSecure,
          // Cast the port into a number first, then dispatch the action
          port: Number(data.port),
          // Use WebSocket if TCP is not supported, or WS is explicitly selected
          protocol:
            !isTCPConnectionSupported || data.isWebSocket
              ? Protocol.WS
              : Protocol.TCP,
        })
      );
    },
    onTabSelected(event, value) {
      dispatch(setServerSettingsDialogTab(value));
    },
  })
)(ServerSettingsDialogPresentation);

export default ServerSettingsDialog;
