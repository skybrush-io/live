import isNil from 'lodash-es/isNil';
import { put, select } from 'redux-saga/effects';

import config from '~/config';
import { updateServerSettings } from '~/actions/server-settings';

/**
 * Helper saga that configures the default server and port when the appllication
 * starts up for the first time.
 */
export default function* onboardingSaga() {
  const currentHostName = yield select(
    state => state.dialogs.serverSettings.hostName
  );

  if (isNil(currentHostName)) {
    let port = Number.parseInt(config.server.port, 10);

    if (isNaN(port)) {
      port = 443;
    }

    const updates = {
      active: Boolean(config.server.connectAutomatically),
      hostName: config.server.hostName,
      port,
      isSecure: !isNil(config.server.isSecure) || port === 443
    };

    yield put(updateServerSettings(updates));
  }
}
