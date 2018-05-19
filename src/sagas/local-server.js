/**
 * Sagas related to the discovery and management of the local server instance
 * that is started by the client on-demand if it is configured to do so.
 */

import { all, call, put, select, take } from 'redux-saga/effects'
import { LOAD } from 'redux-storage'

import {
  notifyLocalServerExecutableSearchStarted,
  notifyLocalServerExecutableSearchFinished,
  notifyLocalServerExecutableSearchFailed
} from '../actions/local-server'
import {
  REPLACE_APP_SETTINGS, UPDATE_APP_SETTINGS,
  START_LOCAL_SERVER_EXECUTABLE_SEARCH
} from '../actions/types'
import {
  getLocalServerExecutable,
  getLocalServerSearchPath
} from '../selectors'

/**
 * Saga that attempts to find where the local server is installed on the
 * current machine, based on the local server settings.
 *
 * @param {Function} search  a function that can be invoked with a list of
 *        search paths and that will return a promise that will eventually
 *        resolve to the local server executable on the system
 */
function* localServerExecutableDiscoverySaga (search) {
  let oldSearchPath

  // Wait until the saved state is loaded back into Redux
  yield take(LOAD)

  while (true) {
    const searchPath = yield select(getLocalServerSearchPath)
    const executable = yield select(getLocalServerExecutable)

    if (executable === undefined || searchPath !== oldSearchPath) {
      // Path changed or a re-scan was forced
      // Start searching for the executable of the local server
      yield put(notifyLocalServerExecutableSearchStarted())

      try {
        const serverPath = yield call(() => search(searchPath))
        yield put(notifyLocalServerExecutableSearchFinished(serverPath))
      } catch (reason) {
        if (reason.code === 'ENOENT') {
          yield put(notifyLocalServerExecutableSearchFinished(''))
        } else {
          yield put(notifyLocalServerExecutableSearchFailed(String(reason)))
        }
      }

      oldSearchPath = searchPath
    }

    // Wait for the next signal to start a search
    yield take([
      REPLACE_APP_SETTINGS,
      UPDATE_APP_SETTINGS,
      START_LOCAL_SERVER_EXECUTABLE_SEARCH
    ])
  }
}

/**
 * Compound saga related to the discovery and management of the local server
 * instance that is started by the client on-demand if it is configured to do
 * so.
 *
 * @param {Function} search  a function that can be invoked with a list of
 *        search paths and that will return a promise that will eventually
 *        resolve to the local server executable on the system
 */
export default function* localServerSaga (search) {
  const sagas = []

  if (search) {
    sagas.push(localServerExecutableDiscoverySaga(search))
  }

  yield all(sagas)
}
