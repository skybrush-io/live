/**
 * @file Manager component that is responsible for connecting to the
 * Skybrush server.
 */

import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { parse } from 'shell-quote';

import ReactSocket from '@collmot/react-socket';

import handleError from '~/error-handling';
import { clearBeaconList } from '~/features/beacons/slice';
import { clearClockList } from '~/features/clocks/slice';
import { clearConnectionList } from '~/features/connections/slice';
import { clearDockList } from '~/features/docks/slice';
import { shouldManageLocalServer } from '~/features/local-server/selectors';
import { addLogItem } from '~/features/log/slice';
import {
  calculateAndStoreClockSkew,
  disconnectFromServer,
} from '~/features/servers/actions';
import {
  getClockSkewInMilliseconds,
  getServerUrl,
  isClockSkewSignificant,
  isTimeSyncWarningDialogVisible,
} from '~/features/servers/selectors';
import {
  addServerFeatures,
  clearTimeSyncStatistics,
  clearServerFeatures,
  openTimeSyncWarningDialog,
  setCurrentServerConnectionState,
} from '~/features/servers/slice';
import {
  clearStartTimeAndMethod,
  synchronizeShowSettings,
} from '~/features/show/slice';
import { showError, showNotification } from '~/features/snackbar/actions';
import { MessageSemantics } from '~/features/snackbar/types';
import { clearWeatherData } from '~/features/weather/slice';
import messageHub from '~/message-hub';
import {
  ConnectionState,
  handleConnectionInformationMessage,
} from '~/model/connections';
import {
  handleBeaconInformationMessage,
  handleBeaconPropertiesMessage,
} from '~/model/beacons';
import { handleClockInformationMessage } from '~/model/clocks';
import { handleDockInformationMessage } from '~/model/docks';
import { logLevelForLogLevelName } from '~/utils/logging';

const formatClockSkew = (number) => {
  if (isNil(number)) {
    return 'an unknown amount';
  }

  if (Math.abs(number) < 1000) {
    return `${number.toFixed(0)}ms`;
  }

  if (Math.abs(number) <= 30000) {
    return `${(number / 1000).toFixed(1)}s`;
  }

  return 'more than 30s';
};

/**
 * Component that launches a local Skybrush server instance when mounted.
 */
class LocalServerExecutor extends React.Component {
  static propTypes = {
    args: PropTypes.string,
    onError: PropTypes.func,
    onLogMessage: PropTypes.func,
    onStarted: PropTypes.func,
    port: PropTypes.number,
  };

  constructor() {
    super();

    this._disposer = undefined;
    this._processIsRunning = false;

    this._onLogMessageReceived = this._onLogMessageReceived.bind(this);
    this._onProcessExited = this._onProcessExited.bind(this);
    this._onProcessStartFailed = this._onProcessStartFailed.bind(this);
  }

  componentDidMount() {
    const { localServer } = window.bridge;
    localServer
      .ensureRunning({
        args: parse(this.props.args),
        port: this.props.port,
        callbacks: {
          error: this._onProcessStartFailed,
          exit: this._onProcessExited,
          log: this._onLogMessageReceived,
        },
      })
      .then((disposer) => {
        this._processIsRunning = true;
        this._setDisposer(disposer);

        if (this.props.onStarted) {
          this.props.onStarted();
        }
      }, this._onProcessStartFailed);
  }

  componentDidUpdate(previousProps) {
    if (this.props.port !== previousProps.port) {
      console.warn(
        'changing port while the server is running is not supported'
      );
    } else if (this.props.args !== previousProps.args) {
      console.warn(
        'changing args while the server is running is not supported'
      );
    }
  }

  componentWillUnmount() {
    this._setDisposer(null);
    this._processIsRunning = false;

    const { localServer } = window.bridge;
    localServer.terminate();
  }

  render() {
    return null;
  }

  _setDisposer(disposer) {
    if (this._disposer === disposer) {
      return;
    }

    if (this._disposer) {
      this._disposer();
    }

    this._disposer = disposer;
  }

  _onLogMessageReceived(message) {
    const { onLogMessage } = this.props;
    if (onLogMessage) {
      onLogMessage(message);
    }
  }

  _onProcessExited(code, signal) {
    // Process died unexpectedly
    if (this.props.onError) {
      this.props.onError(
        signal ? `exited with ${signal}` : `exited with code ${code}`,
        this._processIsRunning
      );
    }

    this._setDisposer(null);
    this._processIsRunning = false;
  }

  _onProcessStartFailed(reason) {
    if (this.props.onError) {
      this.props.onError(reason.message, reason);
    }

    this._setDisposer(null);
    this._processIsRunning = false;
  }
}

/**
 * Presentation component that contains a Socket.io socket and handles
 * its events.
 *
 * It may also contain a LocalServerExecutor that launches a local server
 * instance when mounted.
 */
class ServerConnectionManagerPresentation extends React.Component {
  static propTypes = {
    active: PropTypes.bool,
    cliArguments: PropTypes.string,
    needsLocalServer: PropTypes.bool,
    port: PropTypes.number,
    onConnected: PropTypes.func,
    onConnecting: PropTypes.func,
    onConnectionError: PropTypes.func,
    onConnectionTimeout: PropTypes.func,
    onDisconnected: PropTypes.func,
    onLocalServerError: PropTypes.func,
    onLocalServerStarted: PropTypes.func,
    onLogMessageReceivedFromLocalServer: PropTypes.func,
    onMessage: PropTypes.func,
    url: PropTypes.string,
  };

  _bindSocketToHub = (socket) => {
    const wrappedSocket = socket ? socket.socket : null;
    messageHub.emitter = wrappedSocket
      ? wrappedSocket.emit.bind(wrappedSocket)
      : undefined;

    if (this.props.onConnecting && socket) {
      this.props.onConnecting(this.props.url);
    }
  };

  componentDidUpdate(previousProps) {
    const { active, onDisconnected } = this.props;
    if (previousProps.active && !active && onDisconnected) {
      onDisconnected(previousProps.url);
    }
  }

  render() {
    const {
      active,
      cliArguments,
      needsLocalServer,
      port,
      onConnected,
      onConnecting,
      onConnectionError,
      onConnectionTimeout,
      onDisconnected,
      onLocalServerError,
      onLocalServerStarted,
      onLogMessageReceivedFromLocalServer,
      onMessage,
      url,
    } = this.props;

    // The 'key' property of the wrapping <div> is set to the URL as well;
    // this is to force the socket component and the event objects to unmount
    // themselves and then remount when the URL changes -- otherwise the
    // underlying Socket.io connection would not be reconstructed to point
    // to the new URL.
    //
    // Putting the key on the <ReactSocket.Socket> tag is not enough because
    // we also need the events to remount themselves.

    return url && active ? (
      <div key={url}>
        {needsLocalServer ? (
          <LocalServerExecutor
            args={cliArguments}
            port={port}
            onError={onLocalServerError}
            onLogMessage={onLogMessageReceivedFromLocalServer}
            onStarted={onLocalServerStarted}
          />
        ) : null}
        <ReactSocket.Socket
          ref={this._bindSocketToHub}
          name='serverSocket'
          url={url}
          options={{
            transports: ['websocket'],
          }}
        />
        <ReactSocket.Listener
          socket='serverSocket'
          event='connect'
          callback={() => onConnected(url)}
        />
        <ReactSocket.Listener
          socket='serverSocket'
          event='connect_error'
          callback={() => onConnectionError(url)}
        />
        <ReactSocket.Listener
          socket='serverSocket'
          event='connect_timeout'
          callback={() => onConnectionTimeout(url)}
        />
        <ReactSocket.Listener
          socket='serverSocket'
          event='disconnect'
          callback={(reason) => onDisconnected(url, reason)}
        />
        <ReactSocket.Listener
          socket='serverSocket'
          event='fw'
          callback={onMessage}
        />
        <ReactSocket.Listener
          socket='serverSocket'
          event='reconnecting'
          callback={() => onConnecting(url)}
        />
        <ReactSocket.Listener
          socket='serverSocket'
          event='reconnect_attempt'
          callback={() => onConnecting(url)}
        />
      </div>
    ) : (
      <div />
    );
  }
}

/**
 * Thunk action that executes all the tasks that should be executed after
 * establishing a new connection to a server.
 *
 * TODO(ntamas): this should eventually be refactored such that we only
 * dispatch an event, and the slices in ~/features/.../slice can subscribe
 * to this event if they want to update themselves when the server connects
 */
async function executeTasksAfterConnection(dispatch, getState) {
  let response;

  try {
    // Send a CONN-LIST message to the server to get an up-to-date
    // list of connections
    response = await messageHub.sendMessage('CONN-LIST');
    const connectionIds = response.body.ids || [];

    // For each connection ID that we have received, get its status
    // via a CONN-INF message
    response = await messageHub.sendMessage({
      type: 'CONN-INF',
      ids: connectionIds,
    });
    handleConnectionInformationMessage(response.body, dispatch);

    // Send a CLK-LIST message to the server to get an up-to-date
    // list of clocks
    response = await messageHub.sendMessage('CLK-LIST');
    const clockIds = response.body.ids || [];

    // For each clock ID that we have received, get its status
    // via a CLK-INF message
    response = await messageHub.sendMessage({ type: 'CLK-INF', ids: clockIds });
    handleClockInformationMessage(response.body, dispatch);

    // Send an OBJ-LIST message to the server to get an up-to-date
    // list of docking stations
    response = await messageHub.sendMessage({
      type: 'OBJ-LIST',
      filter: ['dock'],
    });
    const dockIds = response.body.ids || [];

    // For each dock ID that we have received, get its status
    // via a DOCK-INF message
    if (dockIds.length > 0) {
      response = await messageHub.sendMessage({
        type: 'DOCK-INF',
        ids: dockIds,
      });
      handleDockInformationMessage(response.body, dispatch);
    }

    // Send an OBJ-LIST message to the server to get an up-to-date
    // list of beacons
    response = await messageHub.sendMessage({
      type: 'OBJ-LIST',
      filter: ['beacon'],
    });
    const beaconIds = response.body.ids || [];

    // For each beacon ID that we have received, get its status
    // via a BCN-INF message and its basic properties via a BCN-PROPS
    // message
    if (beaconIds.length > 0) {
      response = await messageHub.sendMessage({
        type: 'BCN-INF',
        ids: beaconIds,
      });
      handleBeaconInformationMessage(response.body, dispatch);

      response = await messageHub.sendMessage({
        type: 'BCN-PROPS',
        ids: beaconIds,
      });
      handleBeaconPropertiesMessage(response.body, dispatch);
    }

    // Check whether the server supports virtual drones and map caching
    const features = [];
    for (const feature of ['virtual_uavs', 'map_cache']) {
      // eslint-disable-next-line no-await-in-loop
      const supported = await messageHub.query.isExtensionLoaded(feature);
      if (supported) {
        features.push(feature);
      }
    }

    if (features.length > 0) {
      dispatch(addServerFeatures(features));
    }

    // Check if the server supports drone show execution, and if so,
    // synchronize the show settings
    const supportsDroneShows = await messageHub.query.isExtensionLoaded('show');
    if (supportsDroneShows) {
      // Synchronize the start time, the start method and the mapping of the
      // show _from_ the server _to_ the local client.
      dispatch(synchronizeShowSettings('fromServer'));
    }

    // Get the server time to have a quick estimate of the clock skew.
    // We do this late in the connection process; doing it early results in
    // overly high skew estimates when the browser loads the JS page and the
    // connection is established right at startup. (We get >500ms skew
    // frequently).
    await dispatch(
      calculateAndStoreClockSkew(messageHub, { method: 'threshold' })
    );

    // If the clock skew is significant, show a warning message
    if (
      isClockSkewSignificant(getState()) &&
      !isTimeSyncWarningDialogVisible(getState())
    ) {
      const clockSkew = getClockSkewInMilliseconds(getState());
      const formattedClockSkew = formatClockSkew(Math.abs(clockSkew));
      dispatch(
        showNotification({
          message: `Server clock is ${
            clockSkew > 0 ? 'ahead' : 'behind'
          } by ${formattedClockSkew}`,
          buttons: [
            {
              label: 'Show details',
              action: openTimeSyncWarningDialog(),
            },
          ],
          semantics: MessageSemantics.WARNING,
          permanent: true,
        })
      );
    }
  } catch (error) {
    console.error(error);
    handleError(error);
  }
}

/**
 * Thunk action that executes all the tasks that should be executed after
 * disconnecting from a server.
 *
 * TODO(ntamas): this should eventually be refactored such that we only
 * dispatch an event, and the slices in ~/features/.../slice can subscribe
 * to this event if they want to update themselves when the server disconnects
 *
 * @param {function} dispatch  the dispatcher function of the Redux store
 */
async function executeTasksAfterDisconnection(dispatch) {
  dispatch(clearBeaconList());
  dispatch(clearClockList());
  dispatch(clearConnectionList());
  dispatch(clearDockList());
  dispatch(clearServerFeatures());
  dispatch(clearStartTimeAndMethod());
  dispatch(clearTimeSyncStatistics());
  dispatch(clearWeatherData());
}

const ServerConnectionManager = connect(
  // mapStateToProps
  (state) => ({
    active: state.dialogs.serverSettings.active && !state.session.isExpired,
    cliArguments: state.settings.localServer.cliArguments,
    needsLocalServer: shouldManageLocalServer(state),
    port: state.dialogs.serverSettings.port,
    url: getServerUrl(state),
  }),
  // mapDispatchToProps
  (dispatch) => ({
    onConnecting() {
      dispatch(setCurrentServerConnectionState(ConnectionState.CONNECTING));
    },

    onConnected() {
      // Let the user know that we are connected
      dispatch(
        showNotification({
          message: 'Connected to Skybrush server',
          semantics: 'info',
        })
      );
      dispatch(setCurrentServerConnectionState(ConnectionState.CONNECTED));

      // Execute all the tasks that should be executed after establishing a
      // connection to the server
      dispatch(executeTasksAfterConnection);
    },

    onConnectionError() {
      dispatch(setCurrentServerConnectionState(ConnectionState.DISCONNECTED));
    },

    onConnectionTimeout() {
      dispatch(setCurrentServerConnectionState(ConnectionState.DISCONNECTED));
      dispatch(showError('Timeout while connecting to Skybrush server'));
    },

    onDisconnected(url, reason) {
      dispatch((dispatch, getState) => {
        // reason = io client disconnect -- okay
        // reason = io server disconnect -- okay
        // reason = undefined -- okay
        // reason = ping timeout -- will reconnect
        dispatch(setCurrentServerConnectionState(ConnectionState.DISCONNECTED));

        switch (reason) {
          case 'io client disconnect':
            dispatch(showNotification('Disconnected from Skybrush server'));
            break;

          case 'io server disconnect':
            // Server does not close the connection without sending a SYS-CLOSE
            // message so there is no need to show another
            break;

          case 'transport close':
            dispatch(
              showError('Skybrush server closed connection unexpectedly')
            );
            break;

          case 'ping timeout':
            dispatch(showError('Connection to Skybrush server lost'));
            break;

          default:
            // Nothing to do
            break;
        }

        // Determine whether Socket.IO will try to reconnect on its own
        const willReconnect =
          reason === 'ping timeout' || reason === 'transport close';
        if (!willReconnect) {
          // Make sure that our side is notified that the connection mechanism
          // is not active any more. This has to be done only if we are not
          // disconnecting due to switching to another server, so we need to
          // compare the URL we received in the event with the current URL that
          // we are trying to connect to.
          const isSwichingServers = url !== getServerUrl(getState());
          if (!isSwichingServers) {
            dispatch(disconnectFromServer());
          }
        }

        // Execute all the tasks that should be executed after disconnecting from
        // the server
        dispatch(executeTasksAfterDisconnection);
      });
    },

    onLocalServerError(message, wasRunning) {
      const baseMessage = wasRunning
        ? 'Skybrush server died unexpectedly'
        : 'Failed to launch local Skybrush server';
      dispatch(setCurrentServerConnectionState(ConnectionState.DISCONNECTED));
      dispatch(showError(message ? `${baseMessage}: ${message}` : baseMessage));
    },

    onLocalServerStarted() {
      dispatch(setCurrentServerConnectionState(ConnectionState.CONNECTING));
    },

    onLogMessageReceivedFromLocalServer({ id, levelname, name, message }) {
      name = typeof name === 'string' ? name : '';

      const lastDot = name.lastIndexOf('.');
      const module = lastDot >= 0 ? name.slice(lastDot + 1) : name;
      const item = {
        level: logLevelForLogLevelName(levelname),
        module,
        message,
      };

      if (!isNil(id)) {
        item.auxiliaryId = id;
      }

      dispatch(addLogItem(item));
    },

    onMessage(data) {
      messageHub.processIncomingMessage(data);
    },
  })
)(ServerConnectionManagerPresentation);

export default ServerConnectionManager;
