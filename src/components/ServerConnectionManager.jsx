/**
 * @file Manager component that is responsible for connecting to the
 * Flockwave server.
 */

import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import ReactSocket from 'react-socket'

import { showSnackbarMessage } from '../actions/snackbar'

/**
 * Presentation component that contains a Socket.io socket and handles
 * its events.
 */
class ServerConnectionManagerPresentation extends React.Component {
  render () {
    const { hostName, port, onConnected, onDisconnected } = this.props
    const url = `http://${hostName}:${port}`
    return (
      <div>
        <ReactSocket.Socket url={url} />
        <ReactSocket.Event name="connect" callback={onConnected} />
        <ReactSocket.Event name="disconnect" callback={onDisconnected} />
      </div>
    )
  }
}

ServerConnectionManagerPresentation.propTypes = {
  hostName: PropTypes.string,
  port: PropTypes.number,
  onConnected: PropTypes.func,
  onDisconnected: PropTypes.func
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
      dispatch(showSnackbarMessage('Connected to Flockwave server'))
    },
    onDisconnected () {
      dispatch(showSnackbarMessage('Disconnected from Flockwave server'))
    }
  })
)(ServerConnectionManagerPresentation)

export default ServerConnectionManager
