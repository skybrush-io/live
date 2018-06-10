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

import { clearClockList } from '../actions/clocks'
import { clearConnectionList, setConnectionState } from '../actions/connections'
import { showSnackbarMessage } from '../actions/snackbar'
import handleError from '../error-handling'
import messageHub from '../message-hub'
import { ConnectionState, MASTER_CONNECTION_ID,
  handleConnectionInformationMessage } from '../model/connections'
import { handleClockInformationMessage } from '../model/clocks'
import { shouldManageLocalServer } from '../selectors/local-server'

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

    this._killSignalSent = false
    this._process = undefined
    this._processIsRunning = false
    this._onProcessExited = this._onProcessExited.bind(this)
    this._onProcessStartFailed = this._onProcessStartFailed.bind(this)
  }

  componentDidMount () {
    window.bridge.launchServer({
      args: parse(this.props.args),
      port: this.props.port
    }).then(
      subprocess => {
        this._process = subprocess
        this._process.on('error', this._onProcessStartFailed)
        this._process.on('exit', this._onProcessExited)
        if (this.props.onStarted) {
          this._processIsRunning = true
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
    if (this._process) {
      this._killSignalSent = true
      this._process.kill()
      this._process = undefined
      this._processIsRunning = false
    }
  }

  render () {
    return null
  }

  _onProcessExited (code, signal) {
    if (!this._killSignalSent) {
      // Process died unexpectedly
      if (this.props.onError) {
        this.props.onError(
          signal ? `exited with ${signal}` : `exited with code ${code}`,
          this._processIsRunning
        )
      }
    }
    this._process = undefined
    this._processIsRunning = false
  }

  _onProcessStartFailed (reason) {
    if (this.props.onError) {
      this.props.onError(reason.message, reason)
    }
    this._process = undefined
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
      dispatch(setConnectionState(MASTER_CONNECTION_ID, ConnectionState.CONNECTING))
    },

    onConnected () {
      // Let the user know that we are connected
      dispatch(showSnackbarMessage('Connected to Flockwave server'))
      dispatch(setConnectionState(MASTER_CONNECTION_ID, ConnectionState.CONNECTED))

      // Send a CONN-LIST message to the server to get an up-to-date
      // list of connections
      messageHub.sendMessage('CONN-LIST').then(result => {
        const { body } = result

        // For each connection ID that we have received, get its status
        // via a CONN-INF message
        return messageHub.sendMessage({
          type: 'CONN-INF',
          ids: body.ids || []
        })
      }).then(({ body }) => {
        handleConnectionInformationMessage(body, dispatch)
      }).catch(handleError)

      // Send a CLK-LIST message to the server to get an up-to-date
      // list of clocks
      messageHub.sendMessage('CLK-LIST').then(result => {
        const { body } = result

        // For each clock ID that we have received, get its status
        // via a CLK-INF message
        return messageHub.sendMessage({
          type: 'CLK-INF',
          ids: body.ids || []
        })
      }).then(({ body }) => {
        handleClockInformationMessage(body, dispatch)
      }).catch(handleError)
    },

    onConnectionError () {
      dispatch(setConnectionState(MASTER_CONNECTION_ID, ConnectionState.DISCONNECTED))
    },

    onConnectionTimeout () {
      dispatch(setConnectionState(MASTER_CONNECTION_ID, ConnectionState.DISCONNECTED))
      dispatch(showSnackbarMessage('Timeout while connecting to Flockwave server'))
    },

    onDisconnected () {
      dispatch(setConnectionState(MASTER_CONNECTION_ID, ConnectionState.DISCONNECTED))
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
      dispatch(setConnectionState(MASTER_CONNECTION_ID, ConnectionState.DISCONNECTED))
      dispatch(showSnackbarMessage(
        message ? `${baseMessage}: ${message}` : baseMessage
      ))
    },

    onLocalServerStarted () {
      dispatch(setConnectionState(MASTER_CONNECTION_ID, ConnectionState.CONNECTING))
    },

    onMessage (data) {
      messageHub.processIncomingMessage(data)
    }
  })
)(ServerConnectionManagerPresentation)

export default ServerConnectionManager
