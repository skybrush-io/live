/**
 * Sagas related to the discovery and management of the local server instance
 * that is started by the client on-demand if it is configured to do so.
 */

import { endsWith } from 'lodash'
import pify from 'pify'
import { all, call, put, select, take } from 'redux-saga/effects'
import { LOAD } from 'redux-storage'

import path from '@path'
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
import { isRunningOnMac } from '../utils/platform'
import {
  getLocalServerExecutable,
  getLocalServerSearchPath
} from '../selectors'

/**
 * Returns an array containing the names of all directories to scan on
 * the system, _in addition to_ the system path.
 *
 * These directories are derived from the current installed location of
 * the application, with a few platform-specific tweaks.
 *
 * @return {string[]}  the names of the directories to search for the local
 *         Flockwave server executable, besides the system path and the
 *         directories added explicitly by the user in the settings
 */
function getPathsRelatedToAppLocation () {
  // Don't use import(); it won't work with Webpack
  const { remote } = require('electron')
  if (!remote) {
    // We are not running in Electron
    return []
  }

  const appPath = remote.app.getPath('exe')
  const appFolder = path.dirname(appPath)
  const folders = []

  if (isRunningOnMac) {
    if (endsWith(appFolder, '.app/Contents/MacOS')) {
      // This is an .app bundle so let's search the Resources folder within
      // the bundle as well as the folder containing the app bundle itself
      folders.push(path.resolve(path.dirname(appFolder), 'Resources'))
      folders.push(path.dirname(appFolder.substr(0, appFolder.length - 15)))
    } else {
      // Probably not an .app bundle so let's just assume that the server
      // might be in the same folder
      folders.push(appFolder)
    }
  } else {
    folders.push(appFolder)
  }

  return folders
}

const pathsRelatedToAppLocation = getPathsRelatedToAppLocation()
if (window.bridge) {
  window.bridge.console.log(pathsRelatedToAppLocation)
}

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
        const serverPath = yield call(
          () => pify(which)('flockwaved', {
            path: [
              ...pathsRelatedToAppLocation,
              ...searchPath,
              ...process.env.PATH.split(path.delimiter)
            ].join(path.delimiter)
          })
        )
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

export default function* localServerSaga () {
  const sagas = []

  // We start the discovery saga only if we have a "which" module that is not
  // mocked out
  if (!which.isMock) {
    sagas.push(localServerExecutableDiscoverySaga())
  }

  yield all(sagas)
}
