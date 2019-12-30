import parseHeaders from 'http-headers';
import { isLoopback, isV4Format, isV6Format } from 'ip';
import partial from 'lodash-es/partial';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import {
  addDetectedServer,
  addInferredServer,
  removeAllDetectedServers,
  startScanning,
  stopScanning,
  updateDetectedServerLabel
} from '../actions/servers';

export const isServerDetectionSupported =
  window.bridge && window.bridge.createSSDPClient;

/**
 * Presentation component that regularly fires SSDP discovery requests and
 * collects the results when the app is running in a Node.js environment.
 * When UDP sockets are not available (e.g., in the browser), the component
 * simply makes an educated guess for a possible Flockwave server hosted on
 * the same machine as the current page is.
 */
class ServerDetectionManagerPresentation extends React.Component {
  static propTypes = {
    onScanningStarted: PropTypes.func,
    onScanningStopped: PropTypes.func,
    onServerDetected: PropTypes.func,
    onServerHostnameResolved: PropTypes.func,
    onServerInferred: PropTypes.func
  };

  constructor(props) {
    super(props);

    this._ssdpClient = undefined;
    this._timer = undefined;
  }

  componentDidMount() {
    const { onScanningStarted, onServerInferred } = this.props;

    if (!isServerDetectionSupported) {
      if (onServerInferred) {
        onServerInferred(window.location.hostname, 5000, 'sio:');
      }

      return;
    }

    if (onScanningStarted) {
      onScanningStarted();
    }

    this._ssdpClient = window.bridge.createSSDPClient(headers => {
      if (this._ssdpClient === undefined) {
        // Component was already unmounted.
        return;
      }

      const parsedHeaders = parseHeaders(headers);
      if (parsedHeaders.statusCode !== 200) {
        // Not a successful response
        return;
      }

      const { location } = parsedHeaders.headers;
      if (location === undefined) {
        // No location given
        return;
      }

      const { protocol } = new URL(location);
      if (protocol !== 'sio:' && protocol !== 'sio+tls:') {
        // We only support Socket.IO and secure Socket.IO
        return;
      }

      // Create a new, fake URL with http: as the protocol so we can parse the
      // hostname and the port (sio: and sio+tls: is not recognized by the URL
      // class)
      const httpLocation = `http:${location.slice(protocol.length)}`;
      const { hostname, port } = new URL(httpLocation);
      const numericPort = Number(port);
      if (
        !hostname ||
        isNaN(numericPort) ||
        numericPort <= 0 ||
        numericPort > 65535
      ) {
        // Invalid hostname or port
        return;
      }

      if (this.props.onServerDetected) {
        const { key, wasAdded } = this.props.onServerDetected(
          hostname,
          numericPort,
          protocol
        );

        // Perform a DNS lookup on the hostname if was newly added, it is not
        // already a hostname and we have access to a DNS lookup service
        // via window.bridge
        if (key && wasAdded && (isV4Format(hostname) || isV6Format(hostname))) {
          const resolveTo = partial(this.props.onServerHostnameResolved, key);
          if (isLoopback(hostname)) {
            resolveTo('This computer');
          } else if (window.bridge) {
            window.bridge
              .reverseDNSLookup(hostname)
              .then(names => {
                if (names && names.length > 0) {
                  resolveTo(names[0]);
                }
              })
              .catch(error => {
                window.bridge.console.warn(error);
              });
          }
        }
      }
    });

    this._timer = setInterval(this._onTimerFired, 5000);
    this._onTimerFired();
  }

  componentWillUnmount() {
    if (!isServerDetectionSupported) {
      return;
    }

    const { onScanningStopped } = this.props;
    if (onScanningStopped) {
      onScanningStopped();
    }

    if (this._timer !== undefined) {
      clearInterval(this._timer);
      this._timer = undefined;
    }

    if (this._ssdpClient !== undefined) {
      this._ssdpClient = undefined;
    }
  }

  _onTimerFired = () => {
    this._ssdpClient.search('urn:collmot-com:service:flockwave-sio:1');
  };

  render() {
    // Nothing to render; this is a component that works behind the scenes
    return null;
  }
}

export const ServerDetectionManager = connect(
  // mapStateToProps
  () => ({}),
  // mapDispatchToProps
  dispatch => ({
    onScanningStarted() {
      dispatch(removeAllDetectedServers());
      dispatch(startScanning());
    },

    onScanningStopped() {
      dispatch(stopScanning());
    },

    onServerDetected(host, port, protocol) {
      const action = addDetectedServer(host, port, protocol);
      dispatch(action);
      return { key: action.key, wasAdded: Boolean(action.wasAdded) };
    },

    onServerHostnameResolved(key, name) {
      dispatch(updateDetectedServerLabel(key, name));
    },

    onServerInferred(host, port, protocol) {
      const action = addInferredServer(host, port, protocol);
      dispatch(action);
      return action.key;
    }
  })
)(ServerDetectionManagerPresentation);
