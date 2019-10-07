import { all, call, put, select, take } from 'redux-saga/effects'

import {
  setAuthenticatedUser,
  updateCurrentServerAuthenticationSettings
} from '~/actions/servers'
import { showSnackbarMessage } from '~/actions/snackbar'
import { AUTHENTICATE_TO_SERVER, SET_CURRENT_SERVER_CONNECTION_STATE } from '~/actions/types'
import messageHub from '~/message-hub'
import {
  areServerAuthenticationSettingsValid,
  isConnected
} from '~/selectors/servers'

/**
 * Saga that detects when the authentication-related information of the
 * current server we are connected to becomes invalid, and initiates a query
 * of the supported authentication methods.
 */
function* serverAuthenticationSettingsUpdaterSaga () {
  while (true) {
    const isConnectedToServer = yield select(isConnected)
    const settingsValid = yield select(areServerAuthenticationSettingsValid)

    if (isConnectedToServer && !settingsValid) {
      // Settings were invalidated, force a query
      const result = yield call(
        async () => {
          try {
            const { body } = await messageHub.sendMessage('AUTH-INF')
            return {
              methods: body.methods || [],
              required: body.required || false
            }
          } catch (reason) {
            return undefined
          }
        }
      )

      if (result) {
        yield put(updateCurrentServerAuthenticationSettings(result))
      }
    }

    // Wait for the next signal to start a search
    yield take(
      SET_CURRENT_SERVER_CONNECTION_STATE
    )
  }
}

/**
 * Saga that detects successful or failed authentications and shows an
 * appropriate message in the snackbar.
 */
function* authenticationResultNotifierSaga () {
  while (true) {
    const { payload } = yield take(AUTHENTICATE_TO_SERVER + '_FULFILLED')
    const { result, reason, user } = payload

    if (result) {
      yield put(setAuthenticatedUser(user))
      if (user) {
        yield put(showSnackbarMessage({
          message: `You are now authenticated as ${user}`,
          semantics: 'success'
        }))
      } else {
        yield put(showSnackbarMessage({
          message: `You are now deauthenticated`,
          semantics: 'success'
        }))
      }
    } else {
      yield put(showSnackbarMessage({
        message: reason || 'Authentication failed',
        semantics: 'error'
      }))
    }
  }
}

/**
 * Compound saga related to the management of the connection to the upstream
 * Flockwave server.
 */
export default function* serversSaga () {
  const sagas = [
    serverAuthenticationSettingsUpdaterSaga(),
    authenticationResultNotifierSaga()
  ]
  yield all(sagas)
}
