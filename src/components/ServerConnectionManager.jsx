/**
 * @file Manager component that is responsible for connecting to the
 * Flockwave server.
 */

import { autobind } from 'core-decorators'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'
import ReactSocket from 'react-socket'
import { parse } from 'shell-quote'

import { clearClockList } from '~/actions/clocks'
import { clearConnectionList } from '~/actions/connections'
import { setCurrentServerConnectionState } from '~/actions/servers'
import { showSnackbarMessage } from '~/actions/snackbar'
import handleError from '~/error-handling'
import messageHub from '~/message-hub'
import { ConnectionState, handleConnectionInformationMessage } from '~/model/connections'
import { handleClockInformationMessage } from '~/model/clocks'
import { shouldManageLocalServer } from '~/selectors/local-server'

/**
 * Proposes a protocol to use (http or https) depending on the protocol of
 * the location of the current page.
 *
 * @return {string}  the proposed protocol to access the remote server
 */
function proposeProtocol () {
  const { protocol } = window.location
  return protocol === 'file:' ? 'http:' : protocol
}

/**
 * Component that launches a local Flockwave server instance when mounted.
 */
class LocalServerExecutor extends React.Component {
  constructor (props) {
    super(props)

    this._events = undefined
    this._processIsRunning = false

    this._onProcessExited = this._onProcessExited.bind(this)
    this._onProcessStartFailed = this._onProcessStartFailed.bind(this)
  }

  componentDidMount () {
    const { localServer } = window.bridge
    localServer.launch({
      args: parse(this.props.args),
      port: this.props.port
    }).then(
      events => {
        this._processIsRunning = true

        this._attachProcessEventHandlersTo(events)

        if (this.props.onStarted) {
          this.props.onStarted()
        }
      },
      this._onProcessStartFailed
    )
  }

  componentDidUpdate (prevProps) {
    if (this.props.port !== prevProps.port) {
      console.warn('changing port while the server is running is not supported')
    } else if (this.props.args !== prevProps.args) {
      console.warn('changing args while the server is running is not supported')
    }
  }

  componentWillUnmount () {
    this._detachProcessEventHandlers()

    const { localServer } = window.bridge
    this._processIsRunning = false
    localServer.terminate()
  }

  render () {
    return null
  }

  _attachProcessEventHandlersTo (events) {
    if (this._events === events) {
      return
    }

    if (this._events) {
      this._events.removeListener('exit', this._onProcessExited)
      this._events.removeListener('error', this._onProcessStartFailed)
    }

    this._events = events

    if (this._events) {
      this._events.on('exit', this._onProcessExited)
      this._events.on('error', this._onProcessStartFailed)
    }
  }

  _detachProcessEventHandlers () {
    this._attachProcessEventHandlersTo(undefined)
  }

  _onProcessExited (code, signal) {
    // Process died unexpectedly
    if (this.props.onError) {
      this.props.onError(
        signal ? `exited with ${signal}` : `exited with code ${code}`,
        this._processIsRunning
      )
    }

    this._detachProcessEventHandlers()

    this._processIsRunning = false
  }

  _onProcessStartFailed (reason) {
    if (this.props.onError) {
      this.props.onError(reason.message, reason)
    }

    this._detachProcessEventHandlers()

    this._processIsRunning = false
  }
}

LocalServerExecutor.propTypes = {
  args: PropTypes.string,
  onError: PropTypes.func,
  onStarted: PropTypes.func,
  port: PropTypes.number
}

/**
 * Presentation component that contains a Socket.io socket and handles
 * its events.
 *
 * It may also contain a LocalServerExecutor that launches a local server
 * instance when mounted.
 */
class ServerConnectionManagerPresentation extends React.Component {
  @autobind
  _bindSocketToHub (socket) {
    const wrappedSocket = socket ? socket.socket : null
    messageHub.emitter = wrappedSocket ? wrappedSocket.emit.bind(wrappedSocket) : undefined

    if (this.props.onConnecting) {
      this.props.onConnecting()
    }
  }

  componentDidUpdate (prevProps) {
    const { active, onDisconnected } = this.props
    if (prevProps.active && !active && onDisconnected) {
      onDisconnected()
    }
  }

  render () {
    const {
      active, cliArguments, hostName, needsLocalServer, port, protocol, onConnected,
      onConnecting, onConnectionError, onConnectionTimeout, onDisconnected,
      onLocalServerError, onLocalServerStarted, onMessage
    } = this.props
    const url = hostName ? `${protocol || proposeProtocol()}//${hostName}:${port}` : undefined

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
        {needsLocalServer
          ? <LocalServerExecutor args={cliArguments} port={port}
            onError={onLocalServerError}
            onStarted={onLocalServerStarted} />
          : null}
        <ReactSocket.Socket name="serverSocket" url={url} options={{
          transports: ['websocket']
        }} ref={this._bindSocketToHub} />
        <ReactSocket.Listener socket="serverSocket" event="connect" callback={onConnected} />
        <ReactSocket.Listener socket="serverSocket" event="connect_error" callback={onConnectionError} />
        <ReactSocket.Listener socket="serverSocket" event="connect_timeout" callback={onConnectionTimeout} />
        <ReactSocket.Listener socket="serverSocket" event="disconnect" callback={onDisconnected} />
        <ReactSocket.Listener socket="serverSocket" event="fw" callback={onMessage} />
        <ReactSocket.Listener socket="serverSocket" event="reconnect_attempt" callback={onConnecting} />
      </div>
    ) : <div />
  }
}

ServerConnectionManagerPresentation.propTypes = {
  active: PropTypes.bool,
  cliArguments: PropTypes.string,
  hostName: PropTypes.string,
  needsLocalServer: PropTypes.bool,
  port: PropTypes.number,
  protocol: PropTypes.string,
  onConnected: PropTypes.func,
  onConnecting: PropTypes.func,
  onConnectionError: PropTypes.func,
  onConnectionTimeout: PropTypes.func,
  onDisconnected: PropTypes.func,
  onLocalServerError: PropTypes.func,
  onLocalServerStarted: PropTypes.func,
  onMessage: PropTypes.func
}

/**
 * Helper function that executes all the background tasks that should be
 * executed after establishing a new connection to a server.
 *
 * TODO(ntamas): maybe move this to a saga?
 *
 * @param {function} dispatch  the dispatcher function of the Redux store
 */
const executeTasksAfterConnection = async dispatch => {
  let response

  try {
    // Send a CONN-LIST message to the server to get an up-to-date
    // list of connections
    response = await messageHub.sendMessage('CONN-LIST')
    const connectionIds = response.body.ids || []

    // For each connection ID that we have received, get its status
    // via a CONN-INF message
    response = await messageHub.sendMessage({ type: 'CONN-INF', ids: connectionIds })
    handleConnectionInformationMessage(response.body, dispatch)

    // Send a CLK-LIST message to the server to get an up-to-date
    // list of clocks
    response = await messageHub.sendMessage('CLK-LIST')
    const clockIds = response.body.ids || []

    // For each clock ID that we have received, get its status
    // via a CLK-INF message
    response = await messageHub.sendMessage({ type: 'CLK-INF', ids: clockIds })
    handleClockInformationMessage(response.body, dispatch)
  } catch (err) {
    handleError(err)
  }
}

const ServerConnectionManager = connect(
  // mapStateToProps
  state => ({
    active: state.dialogs.serverSettings.active,
    cliArguments: state.settings.localServer.cliArguments,
    hostName: state.dialogs.serverSettings.hostName,
    needsLocalServer: shouldManageLocalServer(state),
    port: state.dialogs.serverSettings.port,
    protocol: state.dialogs.serverSettings.isSecure ? 'https:' : 'http:'
  }),
  // mapDispatchToProps
  dispatch => ({
    onConnecting () {
      dispatch(setCurrentServerConnectionState(ConnectionState.CONNECTING))
    },

    onConnected () {
      // Let the user know that we are connected
      dispatch(showSnackbarMessage({
        message: 'Connected to Flockwave server',
        semantics: 'info'
      }))
      dispatch(setCurrentServerConnectionState(ConnectionState.CONNECTED))

      // Execute all the tasks that should be executed after establishing a
      // connection to the server
      executeTasksAfterConnection(dispatch)
    },

    onConnectionError () {
      dispatch(setCurrentServerConnectionState(ConnectionState.DISCONNECTED))
    },

    onConnectionTimeout () {
      dispatch(setCurrentServerConnectionState(ConnectionState.DISCONNECTED))
      dispatch(showSnackbarMessage({
        message: 'Timeout while connecting to Flockwave server',
        semantics: 'error'
      }))
    },

    onDisconnected () {
      dispatch(setCurrentServerConnectionState(ConnectionState.DISCONNECTED))
      dispatch(showSnackbarMessage('Disconnected from Flockwave server'))
      dispatch(clearClockList())
      dispatch(clearConnectionList())
    },

    onLocalServerError (message, wasRunning) {
      const baseMessage = (
        wasRunning
          ? 'Flockwave server died unexpectedly'
          : 'Failed to launch local Flockwave server'
      )
      dispatch(setCurrentServerConnectionState(ConnectionState.DISCONNECTED))
      dispatch(showSnackbarMessage({
        message: message ? `${baseMessage}: ${message}` : baseMessage,
        semantics: 'error'
      }))
    },

    onLocalServerStarted () {
      dispatch(setCurrentServerConnectionState(ConnectionState.CONNECTING))
    },

    onMessage (data) {
      messageHub.processIncomingMessage(data)
    }
  })
)(ServerConnectionManagerPresentation)

export default ServerConnectionManager
