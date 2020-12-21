import { delay, put } from 'redux-saga/effects';

/**
 * Helper function that tries to put a value in a channel with a limited buffer,
 * retrying it repeatedly if the channel is full.
 */
export function* putWithRetry(chan, value, { retryDelay = 50 } = {}) {
  while (true) {
    try {
      yield put(chan, value);
      break;
    } catch {
      // Channel overflow, try again a bit later
      yield delay(retryDelay);
    }
  }
}
