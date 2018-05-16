/**
 * Sagas related to the discovery and management of the local server instance
 * that is started by the client on-demand if it is configured to do so.
 */

import pify from 'pify'
import { all, call, put, select, take } from 'redux-saga/effects'
import { LOAD } from 'redux-storage'
import which from '@which'

import {
  notifyLocalServerExecutableSearchStarted,
  notifyLocalServerExecutableSearchFinished,
  notifyLocalServerExecutableSearchFailed
} from '../actions/local-server'
import {
  REPLACE_APP_SETTINGS, UPDATE_APP_SETTINGS,
  START_LOCAL_SERVER_EXECUTABLE_SEARCH
} from '../actions/types'
import { isRunningOnWindows } from '../utils/platform'
import {
  getLocalServerExecutable,
  getLocalServerSearchPath
} from '../selectors'

const pathSep = isRunningOnWindows ? ';' : ':'

/**
 * Saga that attempts to find where the local server is installed on the
 * current machine, based on the local server settings.
 */
function* localServerExecutableDiscoverySaga () {
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
        const path = yield call(
          () => pify(which)('flockwaved', {
            path: [...searchPath, ...process.env.PATH.split(pathSep)].join(pathSep)
          })
        )
        yield put(notifyLocalServerExecutableSearchFinished(path))
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

export default function* localServerSaga () {
  const sagas = []

  // We start the discovery saga only if we have a "which" module that is not
  // mocked out
  if (!which.isMock) {
    sagas.push(localServerExecutableDiscoverySaga())
  }

  yield all(sagas)
}
