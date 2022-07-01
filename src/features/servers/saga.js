import {
  all,
  call,
  delay,
  put,
  putResolve,
  select,
  take,
} from 'redux-saga/effects';

import { authenticateToServer } from './actions';
import {
  areServerAuthenticationSettingsValid,
  getAuthenticationToken,
  isAuthenticated,
  isAuthenticating,
  isConnected,
  requiresAuthentication,
} from './selectors';
import {
  authenticateToServerPromiseFulfilled,
  setAuthenticatedUser,
  setCurrentServerConnectionState,
  updateCurrentServerAuthenticationSettings,
} from './slice';

import { showAuthenticationDialog } from '~/features/servers/actions';
import { showError, showNotification } from '~/features/snackbar/actions';
import messageHub from '~/message-hub';
import { isAuthenticationDialogOpen } from '~/selectors/dialogs';

/**
 * Saga that detects when the authentication-related information of the
 * current server we are connected to becomes invalid, and initiates a query
 * of the supported authentication methods.
 */
function* serverAuthenticationSettingsUpdaterSaga() {
  while (true) {
    const isConnectedToServer = yield select(isConnected);
    const settingsValid = yield select(areServerAuthenticationSettingsValid);

    if (isConnectedToServer && !settingsValid) {
      // Settings were invalidated, force a query
      const result = yield call(async () => {
        try {
          const { body } = await messageHub.sendMessage('AUTH-INF');
          return {
            methods: body.methods || [],
            required: body.required || false,
          };
        } catch {
          return undefined;
        }
      });

      const user = yield call(async () => {
        try {
          const { body } = await messageHub.sendMessage('AUTH-WHOAMI');
          return body.user || '';
        } catch {
          return '';
        }
      });

      if (result) {
        result.user = user;
        yield put(updateCurrentServerAuthenticationSettings(result));
      }
    }

    // Wait for the next signal to start a search
    yield take(setCurrentServerConnectionState.type);
  }
}

/**
 * Saga that detects successful or failed authentications and shows an
 * appropriate message in the snackbar.
 */
function* authenticationResultNotifierSaga() {
  while (true) {
    const { payload } = yield take(authenticateToServerPromiseFulfilled.type);
    const { result, reason, user } = payload;

    if (result) {
      yield put(setAuthenticatedUser(user));
      yield put(
        showNotification({
          message: user
            ? `You are now authenticated as ${user}`
            : 'You are now deauthenticated',
          semantics: 'success',
        })
      );
    } else {
      yield put(showError(reason || 'Authentication failed'));
    }
  }
}

/**
 * Infinite loop that ensures that the authentication dialog is shown if the
 * user is not authenticated yet and is not authenticating at the moment.
 * Returns if the connection breaks.
 */
function* ensureUserIsAuthenticated() {
  while (true) {
    const stillConnected = yield select(isConnected);
    if (!stillConnected) {
      break;
    }

    const shouldAttemptAuthenticationNow =
      !(yield select(isAuthenticated)) &&
      !(yield select(isAuthenticating)) &&
      !(yield select(isAuthenticationDialogOpen));

    if (shouldAttemptAuthenticationNow) {
      let unsupervisedAuthenticationSuccessful = false;

      try {
        unsupervisedAuthenticationSuccessful = yield call(
          authenticateWithoutSupervision
        );
      } catch (error) {
        console.error(error);
      }

      if (!unsupervisedAuthenticationSuccessful) {
        yield put(showAuthenticationDialog());
      }
    }

    yield delay(1000);
  }
}

/**
 * Saga that enforces authentication if the server declares that it is
 * authentication-only.
 */
function* enforceAuthenticationIfNeededSaga() {
  while (true) {
    const isConnectedToServer = yield select(isConnected);
    const settingsValid = yield select(areServerAuthenticationSettingsValid);

    if (isConnectedToServer && settingsValid) {
      // We are connected; does the server need authentication?
      const requiresAuth = yield select(requiresAuthentication);
      if (requiresAuth) {
        // Yes, it does. Attempt to authenticate with a non-interactive method
        // if we can, or show the authentication dialog -- but only if we are
        // not authenticated and not authenticating yet.
        yield* ensureUserIsAuthenticated();
      }
    }

    // Wait until the connection state of the server changes or we receive new
    // authentication settings
    yield take([
      setCurrentServerConnectionState.type,
      updateCurrentServerAuthenticationSettings.type,
    ]);
  }
}

/**
 * Attempts to authenticate the user in an unsupervised manner. This function
 * performs authentication if the user is in possession of a JWT token that the
 * server can digest.
 */
function* authenticateWithoutSupervision() {
  const token = yield select(getAuthenticationToken);

  if (token) {
    const { value } = yield putResolve(
      authenticateToServer({
        method: 'jwt',
        data: token,
        messageHub,
      })
    );

    if (value && value.result) {
      return true;
    }

    return false;
  }

  return false;
}

/**
 * Compound saga related to the management of the connection to the upstream
 * Skybrush server.
 */
export default function* serversSaga() {
  const sagas = [
    serverAuthenticationSettingsUpdaterSaga(),
    enforceAuthenticationIfNeededSaga(),
    authenticationResultNotifierSaga(),
  ];
  yield all(sagas);
}
