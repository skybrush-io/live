/**
 * The root saga of the Flockwave application.
 */

import { all } from 'redux-saga/effects'

import localServerSaga from './local-server'

/**
 * The root saga of the Flockwave application.
 */

export default function* rootSaga () {
  const sagas = []

  if (window.bridge && window.bridge.searchForServer) {
    sagas.push(localServerSaga(window.bridge.searchForServer))
  }

  yield all(sagas)
}
