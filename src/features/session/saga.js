import { decode } from 'jsonwebtoken';
import { delay, put, select } from 'redux-saga/effects';

import { disconnectFromServer } from '~/features/servers/actions';
import { getAuthenticationTokenFromUrl } from '~/utils/authentication';

import {
  ensureSessionExpiresNoLaterThan,
  ensureSessionIsNotLongerThan,
  expireSession,
} from './slice';

/**
 * Saga that handles the termination of the current session when the session
 * expires.
 */
export default function* sessionExpiryManagementSaga({ maxLengthInSeconds }) {
  const token = getAuthenticationTokenFromUrl();

  if (token) {
    // We have an authentication token. If it is a JWT token, get the expiry
    // date of the token and don't let the session be longer than this.
    try {
      const decodedToken = decode(token);
      if (decodedToken && typeof decodedToken.exp === 'number') {
        yield put(ensureSessionExpiresNoLaterThan(decodedToken.exp * 1000));
      }
    } catch {
      // Probably not a JWT token
    }
  }

  if (typeof maxLengthInSeconds === 'number' && maxLengthInSeconds > 0) {
    // We were given a maximum session length in seconds. Limit the expiry
    // time in the store.
    yield put(ensureSessionIsNotLongerThan(maxLengthInSeconds));
  }

  const expiresAt = yield select((state) => state.session.expiresAt);
  if (expiresAt && typeof expiresAt === 'number' && expiresAt >= 0) {
    const msLeft = expiresAt - Date.now();
    if (msLeft > 0) {
      yield delay(msLeft);
    }

    yield put(expireSession());
    yield put(disconnectFromServer());
  }
}
