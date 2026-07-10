import isNil from 'lodash-es/isNil';
import { buffers, type Channel, channel, type Task } from 'redux-saga';
import {
  all,
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
import { getMaximumConcurrentUploadTaskCount } from '~/features/settings/selectors';
import type { ProgressStatus } from '~/flockwave/messages';
import type { RootState } from '~/store/reducers';
import { flashLightOnUAVsAndHideFailures } from '~/utils/messaging';
import { createActionListenerSaga, putWithRetry } from '~/utils/sagas';

import { recalculateEstimatedCompletionTime } from './actions';
import {
  getSpecificationForJobType,
  type JobExecutorParams,
  type JobSpecification,
} from './jobs';
import {
  getCurrentUploadJob,
  getNextDroneFromUploadQueue,
  getUploadItemsBeingProcessed,
  shouldFlashLightsOfFailedUploads,
  shouldRetryFailedUploadsAutomatically,
} from './selectors';
import {
  _enqueueFailedUploads,
  _notifyUploadFinished,
  _notifyUploadOnUavCancelled,
  _notifyUploadOnUavFailed,
  _notifyUploadOnUavQueued,
  _notifyUploadOnUavStarted,
  _notifyUploadOnUavSucceeded,
  _notifyUploadStartedAt,
  _setErrorMessageForUAV,
  _setProgressInfoForUAV,
  cancelUpload,
  startUpload,
} from './slice';
import type { JobData, JobPayload } from './types';

/* ----- Progress handling -------------------------------------------------- */

type ProgressReportItem = {
  uavId: string;
  progress: ProgressStatus['progress'];
};

const uploadProgressChannel = channel(buffers.fixed<ProgressReportItem>(1));

function* uploadProgressHandlerSaga() {
  while (true) {
    const { uavId, progress }: ProgressReportItem = yield take(
      uploadProgressChannel
    );
    const { percentage } = progress;
    if (typeof percentage === 'number') {
      yield put(_setProgressInfoForUAV(uavId, percentage / 100));
    }
  }
}

const uploadProgressCallback = (
  uavId: ProgressReportItem['uavId'],
  { progress }: ProgressStatus
) => uploadProgressChannel.put({ uavId, progress });

/* ----- Worker management -------------------------------------------------- */

type JobExecutionOutcome =
  | 'success'
  | 'failure'
  | 'cancelled'
  | 'permanent-failure';

/**
 * Special symbol used to make a worker task quit.
 */
const STOP = Symbol('STOP');

type JobExecutionRequest<T = unknown> =
  | {
      executor: JobSpecification<T>['executor'];
      payload: JobPayload;
      selector?: (state: RootState, uavId: string) => T;
      target: string;
    }
  | typeof STOP;

/**
 * Saga that runs a single upload worker.
 */
function* runUploadWorker(
  chan: Channel<JobExecutionRequest>,
  failed: string[]
) {
  let outcome: JobExecutionOutcome | undefined;
  let storedError;

  while (true) {
    const job: JobExecutionRequest = yield take(chan);

    if (job === STOP) {
      break;
    }

    const { executor, payload, selector, target: uavId } = job;
    outcome = undefined;
    storedError = undefined;

    let data: unknown = undefined;

    try {
      yield put(_notifyUploadOnUavStarted(uavId));
      data = selector ? yield select(selector, uavId) : undefined;
    } catch (error) {
      outcome = 'permanent-failure';
      storedError = error;
    }

    if (outcome === undefined) {
      try {
        yield call(
          executor,
          { uavId, payload, data } as JobExecutorParams<unknown>,
          {
            onProgress: uploadProgressCallback,
          }
        );
        outcome = 'success';
      } catch (error) {
        outcome = 'failure';
        storedError = error;
      } finally {
        const wasCancelled: boolean = yield cancelled();
        if (wasCancelled && !outcome) {
          outcome = 'cancelled';
        }
      }
    }

    switch (outcome) {
      case 'success':
        yield put(_notifyUploadOnUavSucceeded(uavId));
        break;

      case 'permanent-failure':
      case 'failure':
        // Only add normal failures to the failed list. Other failures must
        // not be retried, because they could cause an infinite loop.
        if (outcome === 'failure') {
          failed.push(uavId);
        }
        yield put(_notifyUploadOnUavFailed(uavId));
        yield put(
          _setErrorMessageForUAV(
            uavId,
            errorToString((storedError as any)?.message || storedError)
          )
        );
        break;

      case 'cancelled':
        yield put(_notifyUploadOnUavCancelled(uavId));
        break;

      default:
        console.warn(`Unknown outcome: ${outcome}`);
        break;
    }

    yield put(recalculateEstimatedCompletionTime());
  }
}

/**
 * Saga that manages the execution of an upload operation to multiple drones
 * with a set of worker sagas forked off from the main uploader saga.
 */
function* forkingWorkerManagementSaga(
  spec: JobSpecification<unknown>,
  job: JobData
) {
  const { executor, selector } = spec;
  if (!executor) {
    console.warn(
      `Job type ${job.type} has no executor in its job specification, skipping job`
    );
    return;
  }

  const chan: Channel<JobExecutionRequest> = yield call(
    channel,
    buffers.fixed(1)
  );
  const workerCount: number = yield select(getMaximumConcurrentUploadTaskCount);
  const failed: string[] = [];
  const workers: Task[] = [];

  let finished = false;
  let success = false;

  // create a given number of worker tasks, depending on the max concurrency
  // that we allow for the uploads
  for (let i = 0; i < workerCount; i++) {
    const worker: Task = yield fork(runUploadWorker, chan, failed);
    workers.push(worker);
  }

  // feed the workers with upload jobs
  while (!finished) {
    const uavId: string = yield select(getNextDroneFromUploadQueue);
    const hasMore = !isNil(uavId);

    // First we check whether there is any job in the upload queue that we
    // can start straight away
    if (hasMore) {
      yield put(_notifyUploadOnUavQueued(uavId));
      yield putWithRetry(chan, {
        executor,
        payload: job.payload,
        selector,
        target: uavId,
      });
    } else {
      const shouldFlashLights: boolean = yield select(
        shouldFlashLightsOfFailedUploads
      );
      if (shouldFlashLights && failed.length > 0) {
        void flashLightOnUAVsAndHideFailures(failed, {});
      }

      // No job in the upload queue. If there are jobs that failed _in this
      // session_ and the user wants to retry failed jobs automatically, it
      // is time to put them back in the queue.
      const shouldRetry: boolean = yield select(
        shouldRetryFailedUploadsAutomatically
      );
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
        const itemsBeingProcessed: string[] = yield select(
          getUploadItemsBeingProcessed
        );
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
  const job: JobData = yield select(getCurrentUploadJob);
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

  yield put(_notifyUploadStartedAt(Date.now()));

  // yield put(recalculateEstimatedCompletionTime());

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
    handleError(error, { operation: 'Upload operation' });
    yield put(_notifyUploadFinished({ cancelled: false, success: false }));
  }
}

const startUploadActionListenerSaga = createActionListenerSaga({
  [startUpload.toString()]: uploaderSagaWithCancellation,
});

/**
 * Compound saga related to the management of upload procedures.
 */
export default function* uploadManagementSaga() {
  yield all([startUploadActionListenerSaga(), uploadProgressHandlerSaga()]);
}
