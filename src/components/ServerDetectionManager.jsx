import { autobind } from 'core-decorators'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import {
  addDetectedServer,
  addInferredServer,
  removeAllDetectedServers
} from '../actions/servers'

/**
 * Presentation component that regularly fires SSDP discovery requests and
 * collects the results when the app is running in a Node.js environment.
 * When UDP sockets are not available (e.g., in the browser), the component
 * simply makes an educated guess for a possible Flockwave server hosted on
 * the same machine as the current page is.
 */
class ServerDetectionManagerPresentation extends React.Component {
  constructor (props) {
    super(props)
    this._timer = undefined
  }

  componentDidMount () {
    const { onScanningStarted, onServerInferred } = this.props
    if (onScanningStarted) {
      onScanningStarted()
    }

    if (onServerInferred) {
      onServerInferred(window.location.hostname, 5000)
    }

    this._timer = setInterval(this._onTimerFired, 5000)
    this._onTimerFired()
  }

  componentWillUnmount () {
    if (this._timer !== undefined) {
      clearInterval(this._timer)
      this._timer = undefined
    }
  }

  @autobind
  _onTimerFired () {
    // TODO
  }

  render () {
    // Nothing to render; this is a component that works behind the scenes
    return null
  }
}

ServerDetectionManagerPresentation.propTypes = {
  onScanningStarted: PropTypes.func,
  onServerDetected: PropTypes.func,
  onServerInferred: PropTypes.func
}

export const ServerDetectionManager = connect(
  // mapStateToProps
  state => ({
  }),
  // mapDispatchToProps
  dispatch => ({
    onScanningStarted () {
      dispatch(removeAllDetectedServers())
    },

    onServerDetected (host, port) {
      dispatch(addDetectedServer(host, port))
    },

    onServerInferred (host, port) {
      dispatch(addInferredServer(host, port))
    }
  })
)(ServerDetectionManagerPresentation)
