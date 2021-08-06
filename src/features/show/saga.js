import get from 'lodash-es/get';
import isNil from 'lodash-es/isNil';
import isNumber from 'lodash-es/isNumber';
import isString from 'lodash-es/isString';
import reject from 'lodash-es/reject';
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
  getCommonShowSettings,
  getDroneSwarmSpecification,
  getGeofencePolygonInShowCoordinates,
  getMeanSeaLevelReferenceOfShowCoordinatesOrNull,
  getNextDroneFromUploadQueue,
  getOutdoorShowCoordinateSystem,
  getUploadItemsBeingProcessed,
  isShowAuthorizedToStartLocally,
  isShowOutdoor,
  shouldRetryFailedUploadsAutomatically,
  getShowMetadata,
  getUserDefinedDistanceLimit,
  getUserDefinedHeightLimit,
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
  setShowAuthorization,
  setShowSettingsSynchronizationStatus,
  setStartMethod,
  setStartTime,
  setUAVIdsToStartAutomatically,
  startUpload,
  synchronizeShowSettings,
} from './slice';

import {
  getMissionMapping,
  getReverseMissionMapping,
} from '~/features/mission/selectors';
import messageHub from '~/message-hub';
import { putWithRetry } from '~/utils/sagas';

/**
 * Special symbol used to make a worker task quit.
 */
const STOP = Symbol('STOP');

/**
 * Private selector that constructs the show description to be uploaded to a
 * drone with the given ID.
 */
function createShowConfigurationForUav(state, uavId) {
  const reverseMapping = getReverseMissionMapping(state);
  const missionIndex = reverseMapping ? reverseMapping[uavId] : undefined;

  if (isNil(missionIndex)) {
    throw new Error(`UAV ${uavId} is not in the current mission`);
  }

  const coordinateSystem = getOutdoorShowCoordinateSystem(state);
  if (
    isShowOutdoor(state) &&
    (typeof coordinateSystem !== 'object' ||
      !Array.isArray(coordinateSystem.origin))
  ) {
    throw new TypeError('Show coordinate system not specified');
  }

  const geofencePolygon = getGeofencePolygonInShowCoordinates(state);
  const geofence = {
    version: 1,
    polygons: geofencePolygon
      ? [
          {
            isInclusion: true,
            points: geofencePolygon,
          },
        ]
      : [],
    maxAltitude: getUserDefinedHeightLimit(state),
    maxDistance: getUserDefinedDistanceLimit(state),
  };

  const drones = getDroneSwarmSpecification(state);
  if (!drones || !Array.isArray(drones)) {
    throw new Error('Invalid show configuration in state store');
  }

  const droneSpec = drones[missionIndex];
  if (!droneSpec || typeof droneSpec !== 'object') {
    throw new Error(
      `No specification for UAV ${uavId} (index ${missionIndex})`
    );
  }

  const { settings } = droneSpec;
  if (typeof settings !== 'object') {
    throw new TypeError(
      `Invalid show configuration for UAV ${uavId} (index ${missionIndex}) in state store`
    );
  }

  const { id: missionId } = getShowMetadata(state);

  const amslReference = getMeanSeaLevelReferenceOfShowCoordinatesOrNull(state);

  const result = {
    ...getCommonShowSettings(state),
    ...settings,
    amslReference,
    coordinateSystem,
    geofence,
    mission: {
      id: missionId,
      index: missionIndex,
      displayName: `${missionId || 'drone-show'} / ${missionIndex + 1}`,
    },
  };

  return result;
}

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
 * Saga that retrieves the current show settings from the server and updates
 * the local store accordingly.
 */
function* pullSettingsFromServer() {
  const config = yield call(messageHub.query.getShowConfiguration);
  const { authorized, time, method, uavIds } = get(config, 'start');

  if (
    (isNumber(time) || isNil(time)) &&
    isString(method) &&
    Array.isArray(uavIds)
  ) {
    yield put(setShowAuthorization(Boolean(authorized)));
    yield put(setStartTime(time));
    yield put(setStartMethod(method));
    yield put(setUAVIdsToStartAutomatically(reject(uavIds || [], isNil)));
  } else {
    throw new TypeError('Invalid configuration object received from server');
  }
}

/**
 * Saga that sends the current show settings to the server.
 */
function* pushSettingsToServer() {
  const { time, method } = yield select((state) => state.show.start);
  const authorized = yield select(isShowAuthorizedToStartLocally);
  const mapping = yield select(getMissionMapping);
  const uavIdsToStartAutomatically =
    method === 'auto' ? reject(mapping || [], isNil) : [];
  yield call(messageHub.execute.setShowConfiguration, {
    start: { authorized, time, method, uavIds: uavIdsToStartAutomatically },
  });

  // TODO(ntamas): it would be nicer to read the values back from the server
  // by explicitly pulling it
  yield put(setUAVIdsToStartAutomatically(uavIdsToStartAutomatically));
}

/**
 * Saga that synchronizes the settings of the show (start time, start method
 * etc) between the server and the local client.
 *
 * The payload of the action specifies the direction of the synchronization
 */
function* showSettingsSynchronizerSaga(action) {
  const { payload } = action;

  let success = false;

  yield put(setShowSettingsSynchronizationStatus('inProgress'));

  try {
    if (payload === 'fromServer' || payload === 'toClient') {
      yield pullSettingsFromServer();
      success = true;
    } else if (payload === 'toServer' || payload === 'fromClient') {
      yield pushSettingsToServer();
      success = true;
    } else {
      yield put(setShowSettingsSynchronizationStatus('syncInProgress'));
    }
  } catch (error) {
    console.error(error);
    success = false;
  }

  yield put(setShowSettingsSynchronizationStatus(success ? 'synced' : 'error'));
}

const sagaCreator = (mapping) =>
  function* () {
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
  [startUpload]: showUploaderSagaWithCancellation,
  [synchronizeShowSettings]: showSettingsSynchronizerSaga,
});
