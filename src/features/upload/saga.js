import isNil from 'lodash-es/isNil';
import { buffers, CANCEL, channel } from 'redux-saga';
import {
  call,
  cancelled,
  delay,
  fork,
  join,
  put,
  race,
  select,
  take,
} from 'redux-saga/effects';

import {
  getNextDroneFromUploadQueue,
  getUploadItemsBeingProcessed,
  shouldRetryFailedUploadsAutomatically,
} from './selectors';
import {
  cancelUpload,
  _enqueueFailedUploads,
  notifyUploadOnUavCancelled,
  notifyUploadOnUavFailed,
  notifyUploadOnUavQueued,
  notifyUploadOnUavStarted,
  notifyUploadOnUavSucceeded,
  notifyUploadFinished,
  startUpload,
} from './slice';

import { createShowConfigurationForUav } from '~/features/show/selectors';
import messageHub from '~/message-hub';
import { createActionListenerSaga, putWithRetry } from '~/utils/sagas';

/**
 * Special symbol used to make a worker task quit.
 */
const STOP = Symbol('STOP');

/**
 * Handles a single trajectory upload to a drone. Returns a promise that resolves
 * when the trajectory is uploaded. The promise is extended with a cancellation
 * callback for Redux-saga.
 */
function runSingleUpload(uavId, data) {
  // No need for a timeout here; it utilizes the message hub, which has its
  // own timeout for failed command executions (although it is quite long)
  console.log('Running single upload for', uavId);
  const cancelToken = messageHub.createCancelToken();
  const promise = messageHub.execute.uploadDroneShow(
    { uavId, data },
    { cancelToken }
  );
  promise[CANCEL] = () => cancelToken.cancel({ allowFailure: true });
  return promise;
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
      const data = yield select(createShowConfigurationForUav, uavId);
      yield call(runSingleUpload, uavId, data);
      outcome = 'success';
    } catch (error) {
      console.error(error);
      outcome = 'failure';
    } finally {
      if (yield cancelled() && !outcome) {
        outcome = 'cancelled';
      }
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
        console.warn('Unknown outcome: ' + outcome);
        break;
    }
  }
}

/**
 * Saga that handles the uploading of the show to a set of drones.
 */
function* showUploaderSaga({ numWorkers: numberWorkers = 8 } = {}) {
  const chan = yield call(channel, buffers.fixed(1));
  const failed = [];
  const workers = [];

  let finished = false;
  let success = false;

  // create a given number of worker tasks, depending on the max concurrency
  // that we allow for the uploads
  for (let i = 0; i < numberWorkers; i++) {
    const worker = yield fork(runUploadWorker, chan, failed);
    workers.push(worker);
  }

  // feed the workers with upload jobs
  while (!finished) {
    const uavId = yield select(getNextDroneFromUploadQueue);

    // First we check whether there is any job in the upload queue that we
    // can start straight away
    if (!isNil(uavId)) {
      yield put(notifyUploadOnUavQueued(uavId));
      yield putWithRetry(chan, uavId);
    } else {
      // No job in the upload queue. If there are jobs that failed _in this
      // session_ and the user wants to retry failed jobs automatically, it
      // is time to put them
      // back in the queue.
      const shouldRetry = yield select(shouldRetryFailedUploadsAutomatically);
      if (shouldRetry && failed.length > 0) {
        const toEnqueue = [...failed];
        failed.length = 0;

        // Do not call retryFailedUploads() here because that would retry
        // _all_ failed uploads, even the ones that failed in a previous
        // session
        yield put(_enqueueFailedUploads(toEnqueue));
      } else {
        // No failed jobs or we don't want to restart them automatically.
        // Let's check whether there are any jobs still in progress; we need
        // to wait for them to complete because the user may still check
        // the "Retry failed uploads" checkbox any time.
        const itemsBeingProcessed = yield select(getUploadItemsBeingProcessed);
        if (itemsBeingProcessed.length > 0) {
          // Wait a bit; there's no point in busy waiting.
          yield delay(500);
        } else {
          finished = true;
          success = failed.length === 0;
        }
      }
    }
  }

  // send the stop signal to the workers
  for (let i = 0; i < numberWorkers; i++) {
    yield putWithRetry(chan, STOP);
  }

  // wait for all workers to terminate
  yield join(workers);

  return success;
}

/**
 * Saga that starts an upload saga and waits for either the upload saga to
 * finish, or a cancellation action.
 */
function* showUploaderSagaWithCancellation() {
  const { cancelled, success } = yield race({
    success: call(showUploaderSaga),
    cancelled: take(cancelUpload),
  });

  yield put(notifyUploadFinished(cancelled ? { cancelled } : { success }));
}

/**
 * Compound saga related to the management of the background processes related
 * to drone shows; e.g., the uploading of a show to the drones.
 */
export default createActionListenerSaga({
  [startUpload]: showUploaderSagaWithCancellation,
});
