/**
 * The root saga of the Flockwave application.
 */

import { all } from 'redux-saga/effects'

import localServerSaga from './local-server'

/**
 * The root saga of the Flockwave application.
 */

export default function* rootSaga () {
  const { localServer } = (window ? window.bridge : null) || {}
  const sagas = []

  if (localServer && localServer.search) {
    sagas.push(localServerSaga(localServer.search))
  }

  yield all(sagas)
}
