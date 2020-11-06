/**
 * @file Manager component that is responsible for connecting to the
 * Skybrush server.
 */

import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { parse } from 'shell-quote';
import { createSelector } from '@reduxjs/toolkit';

import ReactSocket from '@collmot/react-socket';

import { disconnectFromServer } from '~/actions/server-settings';
import { clearClockList } from '~/features/clocks/slice';
import { clearConnectionList } from '~/features/connections/slice';
import { clearDockList } from '~/features/docks/slice';
import { shouldManageLocalServer } from '~/features/local-server/selectors';
import {
  addServerFeature,
  clearClockSkew,
  clearServerFeatures,
  setClockSkewInMilliseconds,
  setCurrentServerConnectionState,
} from '~/features/servers/slice';
import {
  clearStartTimeAndMethod,
  synchronizeShowSettings,
} from '~/features/show/slice';
import { showNotification } from '~/features/snackbar/slice';
import { MessageSemantics } from '~/features/snackbar/types';
import handleError from '~/error-handling';
import { estimateClockSkewAndRoundTripTime } from '~/flockwave/timesync';
import messageHub from '~/message-hub';
import {
  ConnectionState,
  handleConnectionInformationMessage,
} from '~/model/connections';
import { handleClockInformationMessage } from '~/model/clocks';
import { handleDockInformationMessage } from '~/model/docks';

/**
 * Component that launches a local Skybrush server instance when mounted.
 */
class LocalServerExecutor extends React.Component {
  static propTypes = {
    args: PropTypes.string,
    onError: PropTypes.func,
    onStarted: PropTypes.func,
    port: PropTypes.number,
  };

  constructor() {
    this._events = undefined;
    this._processIsRunning = false;

    this._onProcessExited = this._onProcessExited.bind(this);
    this._onProcessStartFailed = this._onProcessStartFailed.bind(this);
  }

  componentDidMount() {
    const { localServer } = window.bridge;
    localServer
      .launch({
        args: parse(this.props.args),
        port: this.props.port,
      })
      .then((events) => {
        this._processIsRunning = true;

        this._attachProcessEventHandlersTo(events);

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
    this._detachProcessEventHandlers();

    const { localServer } = window.bridge;
    this._processIsRunning = false;
    localServer.terminate();
  }

  render() {
    return null;
  }

  _attachProcessEventHandlersTo(events) {
    if (this._events === events) {
      return;
    }

    if (this._events) {
      this._events.removeListener('exit', this._onProcessExited);
      this._events.removeListener('error', this._onProcessStartFailed);
    }

    this._events = events;

    if (this._events) {
      this._events.on('exit', this._onProcessExited);
      this._events.on('error', this._onProcessStartFailed);
    }
  }

  _detachProcessEventHandlers() {
    this._attachProcessEventHandlersTo(undefined);
  }

  _onProcessExited(code, signal) {
    // Process died unexpectedly
    if (this.props.onError) {
      this.props.onError(
        signal ? `exited with ${signal}` : `exited with code ${code}`,
        this._processIsRunning
      );
    }

    this._detachProcessEventHandlers();

    this._processIsRunning = false;
  }

  _onProcessStartFailed(reason) {
    if (this.props.onError) {
      this.props.onError(reason.message, reason);
    }

    this._detachProcessEventHandlers();

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
 * Helper function that executes all the tasks that should be executed after
 * establishing a new connection to a server.
 *
 * TODO(ntamas): this should eventually be refactored such that we only
 * dispatch an event, and the slices in ~/features/.../slice can subscribe
 * to this event if they want to update themselves when the server connects
 *
 * @param {function} dispatch  the dispatcher function of the Redux store
 */
async function executeTasksAfterConnection(dispatch) {
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
    response = await messageHub.sendMessage({
      type: 'DOCK-INF',
      ids: dockIds,
    });
    handleDockInformationMessage(response.body, dispatch);

    // Check if the server supports virtual drones
    const supportsVirtualDrones = await messageHub.query.isExtensionLoaded(
      'virtual_uavs'
    );
    if (supportsVirtualDrones) {
      dispatch(addServerFeature('virtual_uavs'));
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
    //
    // TODO(ntamas): later on, we should do this regularly. Take a look at the
    // clockskew package on npm and implement a saga that is similar.
    const {
      clockSkew,
      roundTripTime,
    } = await estimateClockSkewAndRoundTripTime(messageHub);

    dispatch(setClockSkewInMilliseconds(clockSkew));
  } catch (error) {
    console.error(error);
    handleError(error);
  }
}

/**
 * Helper function that executes all the tasks that should be executed after
 * disconnecting from a server.
 *
 * TODO(ntamas): this should eventually be refactored such that we only
 * dispatch an event, and the slices in ~/features/.../slice can subscribe
 * to this event if they want to update themselves when the server disconnects
 *
 * @param {function} dispatch  the dispatcher function of the Redux store
 */
async function executeTasksAfterDisconnection(dispatch) {
  dispatch(clearClockList());
  dispatch(clearClockSkew());
  dispatch(clearConnectionList());
  dispatch(clearDockList());
  dispatch(clearServerFeatures());
  dispatch(clearStartTimeAndMethod());
}

/**
 * Selector that returns a unique URL that fully identifies the server we are
 * trying to connect to.
 */
const getServerUrl = createSelector(
  (state) => state.dialogs.serverSettings.hostName,
  (state) => state.dialogs.serverSettings.port,
  (state) => state.dialogs.serverSettings.isSecure,
  (hostName, port, isSecure) => {
    const protocol = isSecure ? 'https:' : 'http:';
    return hostName ? `${protocol}//${hostName}:${port}` : undefined;
  }
);

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
      executeTasksAfterConnection(dispatch);
    },

    onConnectionError() {
      dispatch(setCurrentServerConnectionState(ConnectionState.DISCONNECTED));
    },

    onConnectionTimeout() {
      dispatch(setCurrentServerConnectionState(ConnectionState.DISCONNECTED));
      dispatch(
        showNotification({
          message: 'Timeout while connecting to Skybrush server',
          semantics: 'error',
        })
      );
    },

    onDisconnected: (url, reason) => (dispatch, getState) => {
      // reason = io client disconnect -- okay
      // reason = io server disconnect -- okay
      // reason = undefined -- okay
      // reason = ping timeout -- will reconnect
      dispatch(setCurrentServerConnectionState(ConnectionState.DISCONNECTED));

      if (reason === 'io client disconnect') {
        dispatch(showNotification('Disconnected from Skybrush server'));
      } else if (reason === 'io server disconnect') {
        // Server does not close the connection without sending a SYS-CLOSE
        // message so there is no need to show another
      } else if (reason === 'transport close') {
        dispatch(
          showNotification({
            message: 'Skybrush server closed connection unexpectedly',
            semantics: MessageSemantics.ERROR,
          })
        );
      } else if (reason === 'ping timeout') {
        dispatch(
          showNotification({
            message: 'Connection to Skybrush server lost',
            semantics: MessageSemantics.ERROR,
          })
        );
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
        if (url === getServerUrl(getState())) {
          dispatch(disconnectFromServer());
        }
      }

      // Execute all the tasks that should be executed after disconnecting from
      // the server
      executeTasksAfterDisconnection(dispatch);
    },

    onLocalServerError(message, wasRunning) {
      const baseMessage = wasRunning
        ? 'Skybrush server died unexpectedly'
        : 'Failed to launch local Skybrush server';
      dispatch(setCurrentServerConnectionState(ConnectionState.DISCONNECTED));
      dispatch(
        showNotification({
          message: message ? `${baseMessage}: ${message}` : baseMessage,
          semantics: 'error',
        })
      );
    },

    onLocalServerStarted() {
      dispatch(setCurrentServerConnectionState(ConnectionState.CONNECTING));
    },

    onMessage(data) {
      messageHub.processIncomingMessage(data);
    },
  })
)(ServerConnectionManagerPresentation);

export default ServerConnectionManager;
