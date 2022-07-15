import { all, delay, put, takeLeading } from 'redux-saga/effects';

/**
 * Creates a saga that listens for a set of actions and forks new sagas when
 * one of the actions is dispatched.
 *
 * When a saga is already running for a given action, the action is ignored.
 *
 * @param {object} mapping  a mapping from action types to the sagas to start
 *        when the action is dispatched
 * @returns
 */
export const createActionListenerSaga = (mapping) =>
  function* () {
    yield all(
      Object.keys(mapping).map((action) => takeLeading(action, mapping[action]))
    );
  };

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
