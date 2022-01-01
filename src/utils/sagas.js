import { delay, fork, put, take, takeLeading } from 'redux-saga/effects';

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
export function createActionListenerSaga(mapping) {
  return function* () {
    const actions = Object.keys(mapping);

    if (actions.length === 1) {
      // This is the same as takeLeading() from redux-saga
      yield takeLeading(actions[0], mapping[actions[0]]);
    } else if (actions.length > 1) {
      const tasks = {};

      while (true) {
        const action = yield take(actions);

        if (tasks[action.type]) {
          if (tasks[action.type].isRunning()) {
            // ignore the action
            continue;
          } else {
            delete tasks[action.type];
          }
        }

        const saga = mapping[action.type];
        if (saga) {
          tasks[action.type] = yield fork(saga, action);
        }
      }
    }
  };
}

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
