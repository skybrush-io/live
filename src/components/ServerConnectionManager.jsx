/**
 * @file Manager component that is responsible for connecting to the
 * Flockwave server.
 */

import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import ReactSocket from 'react-socket'

import { clearConnectionList, setConnectionState } from '../actions/connections'
import { showSnackbarMessage } from '../actions/snackbar'
import { ConnectionState, MASTER_CONNECTION_ID,
         handleConnectionInformationMessage } from '../connections'
import handleError from '../error-handling'
import messageHub from '../message-hub'

/**
 * Presentation component that contains a Socket.io socket and handles
 * its events.
 */
class ServerConnectionManagerPresentation extends React.Component {
  _bindSocketToHub (socket) {
    const wrappedSocket = socket ? ReactSocket.Socket.socket(socket.props.name) : null
    messageHub.emitter = wrappedSocket ? wrappedSocket.emit.bind(wrappedSocket) : undefined
  }

  render () {
    const { hostName, port, onConnected, onDisconnected, onMessage } = this.props
    const url = hostName ? `http://${hostName}:${port}` : undefined

    // The 'key' property of the wrapping <div> is set to the URL as well;
    // this is to force the socket component and the event objects to unmount
    // themselves and then remount when the URL changes -- otherwise the
    // underlying Socket.io connection would not be reconstructed to point
    // to the new URL.
    //
    // Putting the key on the <ReactSocket.Socket> tag is not enough because
    // we also need the events to remount themselves.

    return url ? (
      <div key={url}>
        <ReactSocket.Socket url={url} ref={this._bindSocketToHub}/>
        <ReactSocket.Event name="connect" callback={onConnected} />
        <ReactSocket.Event name="disconnect" callback={onDisconnected} />
        <ReactSocket.Event name="fw" callback={onMessage} />
      </div>
    ) : <div></div>
  }
}

ServerConnectionManagerPresentation.propTypes = {
  hostName: PropTypes.string,
  port: PropTypes.number,
  onConnected: PropTypes.func,
  onDisconnected: PropTypes.func,
  onMessage: PropTypes.func
}

const ServerConnectionManager = connect(
  // mapStateToProps
  state => ({
    hostName: state.serverSettings.hostName,
    port: state.serverSettings.port
  }),
  // mapDispatchToProps
  dispatch => ({
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
    },
    onDisconnected () {
      dispatch(setConnectionState(MASTER_CONNECTION_ID, ConnectionState.DISCONNECTED))
      dispatch(showSnackbarMessage('Disconnected from Flockwave server'))
      dispatch(clearConnectionList())
    },
    onMessage (data) {
      messageHub.processIncomingMessage(data)
    }
  })
)(ServerConnectionManagerPresentation)

export default ServerConnectionManager
