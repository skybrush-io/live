import delay from 'delay';
import isNil from 'lodash-es/isNil';
import { channel } from 'redux-saga';
import {
  call,
  cancelled,
  fork,
  join,
  put,
  race,
  select,
  take
} from 'redux-saga/effects';

import { getNextDroneFromUploadQueue } from './selectors';
import {
  cancelUpload,
  notifyUploadOnUavCancelled,
  notifyUploadOnUavFailed,
  notifyUploadOnUavQueued,
  notifyUploadOnUavStarted,
  notifyUploadOnUavSucceeded,
  notifyUploadFinished,
  startUpload
} from './slice';

/**
 * Special symbol used to make a worker task quit.
 */
const STOP = Symbol('STOP');

/**
 * Handles a single trajectory upload to a drone.
 */
async function runSingleUpload(uavId) {
  await delay(Math.random() * 1000 + 500);
  throw new Error('fail ' + uavId);
}

/**
 * Saga that runs a single upload worker.
 */
function* runUploadWorker(chan, failed) {
  let outcome;

  while (true) {
    const job = yield take(chan);

    if (job === STOP) {
      break;
    }

    const uavId = job;
    outcome = undefined;

    try {
      yield put(notifyUploadOnUavStarted(uavId));
      yield call(runSingleUpload, uavId);
      outcome = 'success';
    } catch (error) {
      console.error(error);
      outcome = 'failure';
    } finally {
      if (cancelled() && !outcome) {
        outcome = 'cancelled';
      }

      switch (outcome) {
        case 'success':
          yield put(notifyUploadOnUavSucceeded(uavId));
          break;

        case 'failure':
          failed.push(uavId);
          yield put(notifyUploadOnUavFailed(uavId));
          break;

        case 'cancelled':
          yield put(notifyUploadOnUavCancelled(uavId));
          break;

        default:
          console.warm('Unknown outcome: ' + outcome);
          break;
      }
    }
  }
}

/**
 * Saga that handles the uploading of the show to a set of drones.
 */
function* showUploaderSaga({ numWorkers = 8 } = {}) {
  const failed = [];
  const chan = yield call(channel);
  const workers = [];

  // create a given number of worker tasks, depending on the max concurrency
  // that we allow for the uploads
  for (let i = 0; i < numWorkers; i++) {
    const worker = yield fork(runUploadWorker, chan, failed);
    workers.push(worker);
  }

  // feed the workers with upload jobs
  while (true) {
    const uavId = yield select(getNextDroneFromUploadQueue);
    if (isNil(uavId)) {
      break;
    }

    yield put(notifyUploadOnUavQueued(uavId));
    yield put(chan, uavId);
  }

  // send the stop signal to the workers
  for (let i = 0; i < numWorkers; i++) {
    yield put(chan, STOP);
  }

  // wait for all workers to terminate
  yield join(workers);

  return failed.length === 0;
}

/**
 * Saga that starts an upload saga and waits for either the upload saga to
 * finish, or a cancellation action.
 */
function* showUploaderSagaWithCancellation() {
  const { cancelled, success } = yield race({
    success: call(showUploaderSaga),
    cancelled: take(cancelUpload)
  });

  if (cancelled) {
    yield put(notifyUploadFinished({ cancelled }));
  } else {
    yield put(notifyUploadFinished({ success }));
  }
}

const sagaCreator = mapping =>
  function*() {
    const actions = Object.keys(mapping);
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
        tasks[startUpload] = yield fork(saga, action);
      }
    }
  };

/**
 * Compound saga related to the management of the background processes related
 * to drone shows; e.g., the uploading of a show to the drones.
 */
export default sagaCreator({
  [startUpload]: showUploaderSagaWithCancellation
});
