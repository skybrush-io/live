import { type PayloadAction } from '@reduxjs/toolkit';
import {
  all,
  call,
  delay,
  put,
  putResolve,
  select,
  take,
} from 'redux-saga/effects';

import {
  type Response_AUTHINF,
  type Response_AUTHWHOAMI,
} from '@skybrush/flockwave-spec';

import { showError, showSuccess } from '~/features/snackbar/actions';
import messageHub from '~/message-hub';
import { isAuthenticationDialogOpen } from '~/selectors/dialogs';

import { authenticateToServer, showAuthenticationDialog } from './actions';
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
import type { AuthenticationResult } from './types';

type AuthenticationSettings = Pick<Response_AUTHINF, 'methods' | 'required'>;

/**
 * Saga that detects when the authentication-related information of the
 * current server we are connected to becomes invalid, and initiates a query
 * of the supported authentication methods.
 */
function* serverAuthenticationSettingsUpdaterSaga(): Generator {
  while (true) {
    const isConnectedToServer: boolean = yield select(isConnected);
    const settingsValid: boolean = yield select(
      areServerAuthenticationSettingsValid
    );

    if (isConnectedToServer && !settingsValid) {
      // Settings were invalidated, force a query
      const result: AuthenticationSettings | undefined = yield call(
        async (): Promise<AuthenticationSettings | undefined> => {
          try {
            const { body } =
              await messageHub.sendMessage<Response_AUTHINF>('AUTH-INF');
            return {
              methods: body.methods || [],
              required: body.required || false,
            };
          } catch {
            return undefined;
          }
        }
      );

      const user: string = yield call(async (): Promise<string> => {
        try {
          const { body } =
            await messageHub.sendMessage<Response_AUTHWHOAMI>('AUTH-WHOAMI');
          return body.user || '';
        } catch {
          return '';
        }
      });

      if (result) {
        yield put(
          updateCurrentServerAuthenticationSettings({ ...result, user })
        );
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
function* authenticationResultNotifierSaga(): Generator {
  while (true) {
    const { payload }: PayloadAction<AuthenticationResult> = yield take(
      authenticateToServerPromiseFulfilled.type
    );
    const { result, reason, user } = payload;

    if (result) {
      yield put(setAuthenticatedUser(user));
      showSuccess(
        user
          ? `You are now authenticated as ${user}`
          : 'You are now deauthenticated'
      );
    } else {
      showError(reason || 'Authentication failed');
    }
  }
}

/**
 * Infinite loop that ensures that the authentication dialog is shown if the
 * user is not authenticated yet and is not authenticating at the moment.
 * Returns if the connection breaks.
 */
function* ensureUserIsAuthenticated(): Generator {
  while (true) {
    const stillConnected: boolean = yield select(isConnected);
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
        unsupervisedAuthenticationSuccessful = (yield call(
          authenticateWithoutSupervision
        )) as boolean;
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
function* enforceAuthenticationIfNeededSaga(): Generator {
  while (true) {
    const isConnectedToServer: boolean = yield select(isConnected);
    const settingsValid: boolean = yield select(
      areServerAuthenticationSettingsValid
    );

    if (isConnectedToServer && settingsValid) {
      // We are connected; does the server need authentication?
      const requiresAuth: boolean = yield select(requiresAuthentication);
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
function* authenticateWithoutSupervision(): Generator {
  const token: string | undefined = yield select(getAuthenticationToken);

  if (token) {
    const { value }: { value: AuthenticationResult } = yield putResolve(
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
export default function* serversSaga(): Generator {
  const sagas = [
    serverAuthenticationSettingsUpdaterSaga(),
    enforceAuthenticationIfNeededSaga(),
    authenticationResultNotifierSaga(),
  ];
  yield all(sagas);
}
