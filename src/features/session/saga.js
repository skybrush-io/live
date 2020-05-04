import { delay, put } from 'redux-saga/effects';

import { disconnectFromServer } from '~/actions/server-settings';

import { expireSession } from './slice';

/**
 * Saga that handles the termination of the current session when the session
 * expires.
 */
export default function* sessionManagementSaga({ maxLengthInSeconds }) {
  yield delay(maxLengthInSeconds * 1000);
  yield put(expireSession());
  yield put(disconnectFromServer());
}
