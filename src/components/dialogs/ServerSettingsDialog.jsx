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
import { Translation, withTranslation } from 'react-i18next';
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
    ? 'serverSettingsDialog.secureConnection'
    : isItemLocal(item)
      ? 'serverSettingsDialog.localConnection'
      : 'serverSettingsDialog.unsecuredConnection';
const securityWarningForServerItem = (item) =>
  isItemSecure(item) || isItemLocal(item)
    ? ''
    : 'serverSettingsDialog.unsecured';

const primaryTextForServerItem = (item) =>
  item.label || addressForServerItem(item);

const secondaryTextForServerItem = (item) =>
  item.label
    ? `${addressForServerItem(item)}${securityWarningForServerItem(item)}`
    : protocolForServerItem(item);

const manualSetupAllowed = !config?.server?.preventManualSetup;

const ConnectionInProgressIndicator = withTranslation()(
  ({ hostName, t, ...rest }) => (
    <SmallProgressIndicator
      label={
        hostName
          ? t('serverSettingsDialog.connectingTo', { hostName })
          : t('serverSettingsDialog.connecting')
      }
      {...rest}
    />
  )
);

ConnectionInProgressIndicator.propTypes = {
  hostName: PropTypes.string,
  t: PropTypes.func,
};

const DetectedServersListPresentation = ({
  isScanning,
  items,
  onItemSelected,
  t,
}) => (
  <List disablePadding style={{ height: 160, overflow: 'auto' }}>
    {isScanning && (!items || items.length === 0) ? (
      <ListItem key='__scanning'>
        <ListItemIcon>
          <CircularProgress color='secondary' size={24} />
        </ListItemIcon>
        <ListItemText
          primary={t('serverSettingsDialog.pleaseWait')}
          secondary={t('serverSettingsDialog.scanningNetwork')}
        />
      </ListItem>
    ) : null}
    {items.map((item) => (
      <ListItem key={item.id} button onClick={partial(onItemSelected, item)}>
        <ListItemIcon>{iconForServerItem(item)}</ListItemIcon>
        <ListItemText
          primary={primaryTextForServerItem(item)}
          secondary={t(secondaryTextForServerItem(item))}
        />
      </ListItem>
    ))}
    {manualSetupAllowed && (
      <ListItem key='__manual' button onClick={partial(onItemSelected, null)}>
        <ListItemIcon>
          <EditIcon />
        </ListItemIcon>
        <ListItemText primary={t('serverSettingsDialog.enterManually')} />
      </ListItem>
    )}
  </List>
);

DetectedServersListPresentation.propTypes = {
  isScanning: PropTypes.bool,
  items: PropTypes.array,
  onItemSelected: PropTypes.func,
  t: PropTypes.func,
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
)(withTranslation()(DetectedServersListPresentation));

const validator = createValidator({
  hostName: required,
  port: [required, integer, between(1, 65535)],
});

const ServerSettingsFormPresentation = ({
  initialValues,
  onKeyPress,
  onSubmit,
  t,
}) => (
  <Form initialValues={initialValues} validate={validator} onSubmit={onSubmit}>
    {({ handleSubmit }) => (
      <form id='serverSettings' onSubmit={handleSubmit} onKeyPress={onKeyPress}>
        <TextField
          fullWidth
          name='hostName'
          label={t('serverSettingsDialog.hostname')}
          variant='filled'
          margin='normal'
        />
        <TextField
          fullWidth
          name='port'
          label={t('serverSettingsDialog.port')}
          variant='filled'
          margin='normal'
        />
        <Switches
          name='isSecure'
          data={{ label: t('serverSettingsDialog.useSecureConnection') }}
        />
        {isTCPConnectionSupported ? (
          <Switches
            name='isWebSocket'
            data={{
              label: t('serverSettingsDialog.useWebSocketProtocol'),
            }}
            helperText={t('serverSettingsDialog.helperText')}
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
  t: PropTypes.func,
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
)(withTranslation()(ServerSettingsFormPresentation));

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
                <Translation>
                  {(t) => (
                    <Typography variant='body2' color='textSecondary'>
                      {t('serverSettingsDialog.autodiscoveryIsNotAvailable')}
                    </Typography>
                  )}
                </Translation>
              </DialogContent>
            );
          }
        } else {
          content.push(
            <DialogContent key='contents'>
              <Translation>
                {(t) => (
                  <Typography variant='body2' color='textSecondary'>
                    {t('serverSettingsDialog.connectingToOtherServers')}
                  </Typography>
                )}
              </Translation>
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
            <Translation>
              {(t) => (
                <Button
                  key='connect'
                  color='primary'
                  onClick={forceFormSubmission}
                >
                  {t('serverSettingsDialog.connect')}
                </Button>
              )}
            </Translation>
          );
        }

        break;

      default:
        break;
    }

    if (manualSetupAllowed) {
      actions.push(
        <Translation>
          {(t) => (
            <Button
              key='disconnect'
              disabled={!active}
              onClick={active ? onDisconnect : undefined}
            >
              {t('serverSettingsDialog.disconnect')}
            </Button>
          )}
        </Translation>
      );
    }

    actions.push(
      <Translation>
        {(t) => (
          <Button key='close' onClick={onClose}>
            {t('general.action.close')}
          </Button>
        )}
      </Translation>
    );

    return (
      <Translation>
        {(t) => (
          <Dialog fullWidth open={open} maxWidth='xs' onClose={onClose}>
            <DialogTabs value={selectedTab} onChange={onTabSelected}>
              <Tab
                value='auto'
                label={
                  !manualSetupAllowed
                    ? t('serverSettingsDialog.preconfiguredServer')
                    : t('serverSettingsDialog.autodetected')
                }
              />
              {manualSetupAllowed && (
                <Tab value='manual' label={t('serverSettingsDialog.manual')} />
              )}
            </DialogTabs>

            <ServerDetectionManager />
            {content}
            <DialogActions>{actions}</DialogActions>
          </Dialog>
        )}
      </Translation>
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
