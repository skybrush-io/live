/**
 * The root saga of the Flockwave application.
 */

import { all } from 'redux-saga/effects'

import localServerSaga from './local-server'

/**
 * The root saga of the Flockwave application.
 */

export default function* rootSaga () {
  const sagas = [localServerSaga()]
  yield all(sagas)
}
