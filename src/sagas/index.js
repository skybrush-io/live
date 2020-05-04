/**
 * The root saga of the Skybrush application.
 */

import config from 'config';

import { all } from 'redux-saga/effects';

import localServerSaga from '~/features/local-server/saga';
import serversSaga from '~/features/servers/saga';
import showSaga from '~/features/show/saga';
import sessionSaga from '~/features/session/saga';
import tourSaga from '~/features/tour/saga';
import uavSyncSaga from '~/features/uavs/saga';
import flock from '~/flock';

import onboardingSaga from './onboarding';

/**
 * The root saga of the Skybrush application.
 */
export default function* rootSaga() {
  const { localServer } = (window ? window.bridge : null) || {};
  const sagas = [
    onboardingSaga(),
    serversSaga(),
    showSaga(),
    tourSaga(),
    uavSyncSaga(flock),
  ];

  if (localServer && localServer.search) {
    sagas.push(localServerSaga(localServer.search));
  }

  if (config && config.session) {
    sagas.push(sessionSaga(config.session));
  }

  yield all(sagas);
}
