import isNil from 'lodash-es/isNil';
import { put, select } from 'redux-saga/effects';

import config from 'config';
import { updateServerSettings } from '~/features/servers/actions';
import { getServerHostname } from '~/features/servers/selectors';
import { isTCPConnectionSupported } from '~/features/servers/server-settings-dialog';
import { Protocol } from '~/features/servers/types';

function isElectronApp() {
  return Boolean(window?.bridge?.isElectron);
}

function guessHostName() {
  if (isElectronApp()) {
    return 'localhost';
  } else {
    const url = new URL(window.location.href);
    return url.hostname;
  }
}

function guessPort() {
  if (isElectronApp()) {
    return 5001;
  } else {
    const url = new URL(window.location.href);
    if (url.port && url.port.length > 0) {
      return url.port;
    } else if (url.protocol === 'http:') {
      return 80;
    } else if (url.protocol === 'https:') {
      return 443;
    } else {
      return 443;
    }
  }
}

/**
 * Helper saga that configures the default server and port when the appllication
 * starts up for the first time.
 */
export default function* onboardingSaga() {
  const currentHostName = yield select(getServerHostname);

  if (isNil(currentHostName)) {
    let { connectAutomatically, hostName, isSecure, port, protocol } =
      config.server;

    // If the server is configured to connect automatically, infer a reasonable
    // default for the hostname and port if they are not given. If the server
    // does not connect automatically, we can leave the hostname and the port
    // empty.
    if (connectAutomatically) {
      if (!hostName) {
        hostName = guessHostName();
      }

      if (isNil(port) || !port) {
        port = guessPort();
      }
    }

    // Parse the port into a number with some reasonable defaults
    port = Number.parseInt(isNil(port) ? config.server.port : port, 10);
    if (Number.isNaN(port)) {
      port = isTCPConnectionSupported ? 5001 : 443;
    }

    if (!protocol) {
      switch (port) {
        case 80:
        case 443:
          // HTTP and HTTPS ports use WebSocket
          protocol = Protocol.WS;
          break;

        case 5000:
          // Default Skybrush server port for WebSocket connections
          protocol = Protocol.WS;
          break;

        case 5001:
          // Default Skybrush server port for TCP connections
          protocol = Protocol.TCP;
          break;

        default:
          // Educated guess
          protocol = isTCPConnectionSupported ? Protocol.TCP : Protocol.WS;
      }
    }

    const updates = {
      active: connectAutomatically,
      protocol,
      hostName,
      port,
      isSecure: isSecure || port === 443,
    };

    yield put(updateServerSettings(updates));
  }
}
