import { all, call, put, select, take } from 'redux-saga/effects'

import { updateCurrentServerAuthenticationSettings } from '~/actions/servers'
import { SET_CURRENT_SERVER_CONNECTION_STATE } from '~/actions/types'
import {
  areServerAuthenticationSettingsValid,
  isConnected
} from '~/selectors/servers'
import messageHub from '~/message-hub'

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
 * Compound saga related to the management of the connection to the upstream
 * Flockwave server.
 */
export default function* serversSaga () {
  const sagas = [
    serverAuthenticationSettingsUpdaterSaga()
  ]
  yield all(sagas)
}
