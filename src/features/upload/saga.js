import isNil from 'lodash-es/isNil';
import { buffers, channel } from 'redux-saga';
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

import { errorToString, handleError } from '~/error-handling';
import { flashLightOnUAVsAndHideFailures } from '~/utils/messaging';
import { createActionListenerSaga, putWithRetry } from '~/utils/sagas';

import { getSpecificationForJobType } from './jobs';
import {
  getCurrentUploadJob,
  getNextDroneFromUploadQueue,
  getUploadItemsBeingProcessed,
  shouldFlashLightsOfFailedUploads,
  shouldRetryFailedUploadsAutomatically,
} from './selectors';
import {
  cancelUpload,
  _enqueueFailedUploads,
  _notifyUploadOnUavCancelled,
  _notifyUploadOnUavFailed,
  _notifyUploadOnUavQueued,
  _notifyUploadOnUavStarted,
  _notifyUploadOnUavSucceeded,
  _notifyUploadFinished,
  _notifyUploadStarted,
  _setErrorMessageForUAV,
  startUpload,
} from './slice';

/**
 * Special symbol used to make a worker task quit.
 */
const STOP = Symbol('STOP');

/**
 * Saga that runs a single upload worker.
 */
function* runUploadWorker(chan, failed) {
  let outcome;
  let storedError;

  while (true) {
    const job = yield take(chan);

    if (job === STOP) {
      break;
    }

    const { executor, payload, selector, target: uavId } = job;
    outcome = undefined;
    storedError = undefined;

    try {
      yield put(_notifyUploadOnUavStarted(uavId));
      const data = selector ? yield select(selector, uavId) : undefined;
      yield call(executor, { uavId, payload, data });
      outcome = 'success';
    } catch (error) {
      outcome = 'failure';
      storedError = error;
    } finally {
      if (yield cancelled() && !outcome) {
        outcome = 'cancelled';
      }
    }

    switch (outcome) {
      case 'success':
        yield put(_notifyUploadOnUavSucceeded(uavId));
        break;

      case 'failure':
        failed.push(uavId);
        yield put(_notifyUploadOnUavFailed(uavId));
        yield put(
          _setErrorMessageForUAV(
            uavId,
            errorToString(storedError.message || storedError)
          )
        );
        break;

      case 'cancelled':
        yield put(_notifyUploadOnUavCancelled(uavId));
        break;

      default:
        console.warn('Unknown outcome: ' + outcome);
        break;
    }
  }
}

/**
 * Saga that manages the execution of an upload operation to multiple drones
 * with a set of worker sagas forked off from the main uploader saga.
 */
function* forkingWorkerManagementSaga(spec, job, { workerCount = 8 } = {}) {
  const { executor, selector } = spec;
  if (!executor) {
    console.warn(
      `Job type ${job.type} has no executor in its job specification, skipping job`
    );
    return;
  }

  const chan = yield call(channel, buffers.fixed(1));
  const failed = [];
  const workers = [];

  let finished = false;
  let success = false;

  // create a given number of worker tasks, depending on the max concurrency
  // that we allow for the uploads
  for (let i = 0; i < workerCount; i++) {
    const worker = yield fork(runUploadWorker, chan, failed);
    workers.push(worker);
  }

  // feed the workers with upload jobs
  while (!finished) {
    const uavId = yield select(getNextDroneFromUploadQueue);

    // First we check whether there is any job in the upload queue that we
    // can start straight away
    if (!isNil(uavId)) {
      yield put(_notifyUploadOnUavQueued(uavId));
      yield putWithRetry(chan, {
        executor,
        payload: job.payload,
        selector,
        target: uavId,
      });
    } else {
      const shouldFlashLights = yield select(shouldFlashLightsOfFailedUploads);
      if (shouldFlashLights && failed.length > 0) {
        flashLightOnUAVsAndHideFailures(failed);
      }

      // No job in the upload queue. If there are jobs that failed _in this
      // session_ and the user wants to retry failed jobs automatically, it
      // is time to put them back in the queue.
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
  for (let i = 0; i < workerCount; i++) {
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
function* uploaderSagaWithCancellation() {
  const job = yield select(getCurrentUploadJob);
  if (!job.type) {
    console.warn('No job type was specified for upload job, skipping');
    return;
  }

  const spec = getSpecificationForJobType(job.type);
  if (!spec) {
    // Unknown job type
    console.warn(`Unknown job type: ${job.type}, skipping`);
    return;
  }

  yield put(_notifyUploadStarted());

  try {
    const { workerManager = forkingWorkerManagementSaga } = spec;
    const { cancelled, success } = yield race({
      success: call(workerManager, spec, job),
      cancelled: take(cancelUpload),
    });
    yield put(
      _notifyUploadFinished({
        cancelled: Boolean(cancelled),
        success: Boolean(success),
      })
    );
  } catch (error) {
    handleError(error, 'Upload operation');
    yield put(_notifyUploadFinished({ cancelled: false, success: false }));
  }
}

/**
 * Compound saga related to the management of the background processes related
 * to drone shows; e.g., the uploading of a show to the drones.
 */
export default createActionListenerSaga({
  [startUpload]: uploaderSagaWithCancellation,
});
