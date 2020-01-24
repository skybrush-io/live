/**
 * The root saga of the Skybrush application.
 */

import { all } from 'redux-saga/effects';

import localServerSaga from '~/features/local-server/saga';
import serversSaga from '~/features/servers/saga';

/**
 * The root saga of the Skybrush application.
 */
export default function* rootSaga() {
  const { localServer } = (window ? window.bridge : null) || {};
  const sagas = [serversSaga()];

  if (localServer && localServer.search) {
    sagas.push(localServerSaga(localServer.search));
  }

  yield all(sagas);
}
