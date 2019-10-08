/**
 * The root saga of the Flockwave application.
 */

import { all, take } from 'redux-saga/effects';
import { LOAD } from 'redux-storage';

import localServerSaga from './local-server';
import serversSaga from './servers';

/**
 * The root saga of the Flockwave application.
 */
export default function* rootSaga() {
  const { localServer } = (window ? window.bridge : null) || {};
  const sagas = [serversSaga()];

  if (localServer && localServer.search) {
    sagas.push(localServerSaga(localServer.search));
  }

  // Wait until the saved state is loaded back into Redux
  yield take(LOAD);

  yield all(sagas);
}
