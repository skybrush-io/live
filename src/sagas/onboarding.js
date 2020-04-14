import isNil from 'lodash-es/isNil';
import { put, select } from 'redux-saga/effects';

import config from 'config';
import { updateServerSettings } from '~/actions/server-settings';

/**
 * Helper saga that configures the default server and port when the appllication
 * starts up for the first time.
 */
export default function* onboardingSaga() {
  const currentHostName = yield select(
    (state) => state.dialogs.serverSettings.hostName
  );

  if (isNil(currentHostName)) {
    let { connectAutomatically, hostName, isSecure, port } = config.server;

    // If the server is configured to connect automatically, infer a reasonable
    // default for the hostname if it is not given. If the server does not
    // connect automatically, we can leave the hostname empty.
    if (connectAutomatically) {
      const url = new URL(window.location.href);

      if (!hostName) {
        hostName = url.hostname;
      }

      if (isNil(port) || !port) {
        if (url.port && url.port.length > 0) {
          port = url.port;
        } else if (url.protocol === 'http:') {
          port = 80;
        } else if (url.protocol === 'https:') {
          port = 443;
        } else {
          port = 443;
        }
      }
    }

    // Parse the port into a number with some reasonable defaults
    port = Number.parseInt(isNil(port) ? config.server.port : port, 10);
    if (Number.isNaN(port)) {
      port = 443;
    }

    const updates = {
      active: connectAutomatically,
      hostName,
      port,
      isSecure: isSecure || port === 443,
    };

    yield put(updateServerSettings(updates));
  }
}
