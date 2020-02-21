import get from 'lodash-es/get';
import isNil from 'lodash-es/isNil';
import isNumber from 'lodash-es/isNumber';
import isString from 'lodash-es/isString';
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

import {
  getCommonShowSettings,
  getDroneSwarmSpecification,
  getNextDroneFromUploadQueue,
  getOutdoorShowCoordinateSystem
} from './selectors';
import {
  cancelUpload,
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
  startUpload,
  synchronizeShowSettings
} from './slice';

import messageHub from '~/message-hub';
import { getReverseMissionMapping } from '~/features/mission/selectors';

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
    typeof coordinateSystem !== 'object' ||
    !Array.isArray(coordinateSystem.origin)
  ) {
    throw new TypeError('Show coordinate system not specified');
  }

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

  return {
    ...getCommonShowSettings(state),
    ...settings,
    coordinateSystem
  };
}

/**
 * Handles a single trajectory upload to a drone.
 */
async function runSingleUpload(uavId, data) {
  await messageHub.execute.uploadDroneShow({ uavId, data });
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

/**
 * Saga that retrieves the current show settings from the server and updates
 * the local store accordingly.
 */
function* pullSettingsFromServer() {
  const config = yield call(messageHub.query.getShowConfiguration);
  const { authorized, time, method } = get(config, 'start');

  if ((isNumber(time) || isNil(time)) && isString(method)) {
    yield put(setShowAuthorization(Boolean(authorized)));
    yield put(setStartTime(time));
    yield put(setStartMethod(method));
  } else {
    throw new TypeError('Invalid configuration object received from server');
  }
}

/**
 * Saga that sends the current show settings to the server.
 */
function* pushSettingsToServer() {
  const { time, method } = yield select(state => state.show.start);

  yield messageHub.execute.setShowConfiguration({
    start: { time, method }
  });
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

  if (success) {
    yield put(setShowSettingsSynchronizationStatus('synced'));
  } else {
    yield put(setShowSettingsSynchronizationStatus('error'));
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
  [startUpload]: showUploaderSagaWithCancellation,
  [synchronizeShowSettings]: showSettingsSynchronizerSaga
});
