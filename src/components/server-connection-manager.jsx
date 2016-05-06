/**
 * @file Manager component that is responsible for connecting to the
 * Flockwave server.
 */

import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import Socket from 'react-socket'

/**
 * Presentation component that contains a Socket.io socket and handles
 * its events.
 */
class ServerConnectionManagerPresentation extends React.Component {
  onConnected () {
    console.log('Socket.io connected')
  }

  onDisconnected () {
    console.log('Socket.io disconnected')
  }

  render () {
    const { hostName, port } = this.props
    const url = `http://${hostName}:${port}`
    return (
      <div>
        <Socket.Socket url={url} />
        <Socket.Event name="connect" callback={this.onConnected} />
        <Socket.Event name="disconnect" callback={this.onDisconnected} />
      </div>
    )
  }
}

ServerConnectionManagerPresentation.propTypes = {
  hostName: PropTypes.string,
  port: PropTypes.number
}

const ServerConnectionManager = connect(
  // mapStateToProps
  state => ({
    hostName: state.serverSettings.hostName,
    port: state.serverSettings.port
  })
)(ServerConnectionManagerPresentation)

export default ServerConnectionManager
