import isNil from 'lodash-es/isNil';
import { buffers, channel, type Channel, type Task } from 'redux-saga';
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
import { type Identifier } from '~/utils/collections';
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
import type {
  HistoryItem,
  JobData,
  JobPayload,
  PerUAVJobResult,
  UploadJobResult,
} from './types';

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

/**
 * Special symbol used to make a worker task quit.
 */
const STOP = Symbol('STOP');

type JobExecutionRequest<Payload, Data, ResultPiece> = {
  executor: JobSpecification<Payload, Data, ResultPiece>['executor'];
  payload: JobPayload;
  selector?: (state: RootState, uavId: string) => Data;
  target: string;
};

type JobExecutionRequestOrStop<
  Payload = unknown,
  Data = unknown,
  ResultPiece = unknown,
> = JobExecutionRequest<Payload, Data, ResultPiece> | typeof STOP;

/**
 * Type describing the outcome of a job, with distinction between
 * temporary and permanent failures.
 */
type Outcome<T, E = unknown> =
  | {
      type: 'success';
      result: T;
    }
  | {
      type: 'failure';
      error: E;
    }
  | {
      type: 'permanent-failure';
      error: E;
    }
  | {
      type: 'cancelled';
    };

type JobExecutionRequestCompletionHandler<Payload, Data, ResultPiece> = (
  req: JobExecutionRequest<Payload, Data, ResultPiece>,
  outcome: Outcome<ResultPiece>
) => void;

/**
 * Saga that runs a single upload worker.
 *
 * @param chan - channel that yields jobs that need to be executed
 */
function* runWorker<Payload, Data, ResultPiece>(
  chan: Channel<JobExecutionRequestOrStop<Payload, Data, ResultPiece>>,
  onCompleted: JobExecutionRequestCompletionHandler<Payload, Data, ResultPiece>
) {
  let outcome: Outcome<ResultPiece> | undefined;

  while (true) {
    const req: JobExecutionRequestOrStop<Payload, Data, ResultPiece> =
      yield take(chan);

    if (req === STOP) {
      break;
    }

    const { executor, payload, selector, target: uavId } = req;
    outcome = undefined;

    let data: Data | undefined = undefined;

    try {
      yield put(_notifyUploadOnUavStarted(uavId));
      data = selector ? yield select(selector, uavId) : undefined;
    } catch (error) {
      outcome = { type: 'permanent-failure', error };
    }

    if (outcome === undefined) {
      try {
        const result: ResultPiece = yield call(
          executor,
          { uavId, payload, data } as JobExecutorParams<Payload, Data>,
          {
            onProgress: uploadProgressCallback,
          }
        );
        outcome = { type: 'success', result };
      } catch (error) {
        outcome = { type: 'failure', error };
      } finally {
        const wasCancelled: boolean = yield cancelled();
        if (wasCancelled && !outcome) {
          outcome = { type: 'cancelled' };
        }
      }
    }

    try {
      onCompleted(req, outcome);
    } catch (error) {
      console.error(
        'Error while executing onCompleted callback, this should never happen'
      );
      // If we ever continue here instead of throwing, we must not overwrite
      // the outcome, not even to permanent-failure.
      throw error;
    }

    switch (outcome.type) {
      case 'success':
        yield put(_notifyUploadOnUavSucceeded(uavId));
        break;

      case 'permanent-failure':
      case 'failure':
        {
          const { error } = outcome;
          yield put(_notifyUploadOnUavFailed(uavId));
          yield put(
            _setErrorMessageForUAV(
              uavId,
              errorToString((error as any)?.message ?? error)
            )
          );
        }
        break;

      case 'cancelled':
        yield put(_notifyUploadOnUavCancelled(uavId));
        break;

      default:
        console.warn(`Unknown outcome: ${(outcome as any).type}`);
        break;
    }

    yield put(recalculateEstimatedCompletionTime());
  }
}

/**
 * Saga that manages the execution of an upload operation to multiple drones
 * with a set of worker sagas forked off from the main uploader saga.
 */
function* forkingWorkerManagementSaga<
  Payload = unknown,
  Data = unknown,
  ResultPiece = unknown,
>(
  spec: JobSpecification<Payload, Data, ResultPiece>,
  job: JobData
): Generator<any, HistoryItem<ResultPiece>> {
  const { executor, selector } = spec;
  const perUAVResults: Record<Identifier, PerUAVJobResult<ResultPiece>> = {};

  if (!executor) {
    console.warn(
      `Job type ${job.type} has no executor in its job specification, skipping job`
    );
    return {
      result: 'success',
      perUAVResults,
    };
  }

  const chan: Channel<JobExecutionRequestOrStop<Payload, Data, ResultPiece>> =
    yield call(channel, buffers.fixed(1));
  const workerCount: number = yield select(getMaximumConcurrentUploadTaskCount);
  const failedAndShouldRetry: string[] = [];
  const permanentlyFailed: string[] = [];
  const workers: Task[] = [];

  let status: UploadJobResult | undefined = undefined;

  // create the completion handler function for tasks
  const onCompleted: JobExecutionRequestCompletionHandler<
    Payload,
    Data,
    ResultPiece
  > = (req, outcome) => {
    // If the job failed, put its target in the failed queue so we can retry it later.
    // Note that we do not do it for permanent failures.
    switch (outcome.type) {
      case 'failure':
        failedAndShouldRetry.push(req.target);
        perUAVResults[req.target] = {
          type: 'error',
          error: errorToString(
            (outcome.error as any)?.message ?? outcome.error
          ),
        };
        break;

      case 'permanent-failure':
        permanentlyFailed.push(req.target);
        perUAVResults[req.target] = {
          type: 'error',
          error: errorToString(
            (outcome.error as any)?.message ?? outcome.error
          ),
        };
        break;

      case 'success':
        perUAVResults[req.target] = { type: 'success', result: outcome.result };
        break;

      case 'cancelled':
        // Nothing to do.
        break;
    }
  };

  // create a given number of worker tasks, depending on the max concurrency
  // that we allow for the uploads
  for (let i = 0; i < workerCount; i++) {
    const worker: Task = yield fork(runWorker as any, chan, onCompleted);
    workers.push(worker);
  }

  // feed the workers with upload jobs
  while (status === undefined) {
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
      if (shouldFlashLights && failedAndShouldRetry.length > 0) {
        void flashLightOnUAVsAndHideFailures(failedAndShouldRetry, {});
      }

      // No job in the upload queue. If there are jobs that failed _in this
      // session_ and the user wants to retry failed jobs automatically, it
      // is time to put them back in the queue.
      const shouldRetry: boolean = yield select(
        shouldRetryFailedUploadsAutomatically
      );
      if (shouldRetry && failedAndShouldRetry.length > 0) {
        const toEnqueue = [...failedAndShouldRetry];
        failedAndShouldRetry.length = 0;

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
          if (failedAndShouldRetry.length > 0 || permanentlyFailed.length > 0) {
            status = 'error';
          } else {
            status = 'success';
          }

          // will break out from the main loop now because status is no
          // longer undefined
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

  return { result: status, perUAVResults };
}

/**
 * Saga that starts an upload saga and waits for either the upload saga to
 * finish, or a cancellation action.
 */
function* uploaderSagaWithCancellation() {
  let status: UploadJobResult;
  let perUAVResults: Record<Identifier, PerUAVJobResult> = {};

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

  try {
    const { workerManager = forkingWorkerManagementSaga } = spec;
    const {
      cancelled,
      workerResult,
    }: {
      cancelled: boolean;
      workerResult?: HistoryItem;
    } = yield race({
      workerResult: call(workerManager, spec, job),
      cancelled: take(cancelUpload),
    });

    if (cancelled) {
      status = 'cancelled';
    } else {
      // `race` resolves exactly one branch; if we were not cancelled, the
      // worker manager must have produced a result.
      status = workerResult!.result;
      perUAVResults = workerResult!.perUAVResults;
    }
  } catch (error) {
    handleError(error, { operation: 'Upload operation' });
    status = 'error';
  }

  const historyItem = {
    result: status,
    perUAVResults,
  };

  yield put(_notifyUploadFinished(historyItem));

  // Call the post-job action _after_ the history item has been committed so
  // the thunk can read committed state from Redux.
  if (spec.postAction) {
    yield put(spec.postAction());
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
