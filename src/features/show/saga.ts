import type { DroneShowConfiguration } from '@skybrush/flockwave-spec';
import get from 'lodash-es/get';
import isNil from 'lodash-es/isNil';
import isNumber from 'lodash-es/isNumber';
import isString from 'lodash-es/isString';
import reject from 'lodash-es/reject';
import { call, put, select } from 'redux-saga/effects';

import { getMissionMapping } from '~/features/mission/selectors';
import messageHub from '~/message-hub';
import { createActionListenerSaga } from '~/utils/sagas';
import type { Nullable } from '~/utils/types';

import { SettingsSynchronizationStatus, StartMethod } from './enums';
import {
  getShowClockReference,
  getShowDuration,
  getShowStartMethod,
  getShowStartTime,
  isShowAuthorizedToStartLocally,
} from './selectors';
import {
  setShowAuthorization,
  setShowSettingsSynchronizationStatus,
  setStartMethod,
  setStartTime,
  setUAVIdsToStartAutomatically,
  synchronizeShowSettings,
} from './slice';

/**
 * Saga that retrieves the current show settings from the server and updates
 * the local store accordingly.
 */
function* pullSettingsFromServer() {
  const config: DroneShowConfiguration = yield call(
    messageHub.query.getShowConfiguration
  );
  const { authorized, clock, time, method, uavIds } = get(config, 'start');

  if (
    (isNumber(time) || isNil(time)) &&
    isString(method) &&
    Array.isArray(uavIds)
  ) {
    yield put(setShowAuthorization(Boolean(authorized)));
    yield put(setStartMethod(method as StartMethod));
    yield put(setUAVIdsToStartAutomatically(reject(uavIds || [], isNil)));
    yield put(setStartTime({ clock, time }));
  } else {
    throw new TypeError('Invalid configuration object received from server');
  }
}

/**
 * Saga that sends the current show settings to the server.
 */
function* pushSettingsToServer() {
  const authorized: boolean = yield select(isShowAuthorizedToStartLocally);
  const clock: string | null = yield select(getShowClockReference);
  const mapping: Array<Nullable<string>> = yield select(getMissionMapping);
  const method: StartMethod = yield select(getShowStartMethod);
  const time: number | null = yield select(getShowStartTime);
  const duration: number = yield select(getShowDuration);
  const uavIdsToStartAutomatically: string[] =
    method === StartMethod.AUTO
      ? (reject(mapping || [], isNil) as string[])
      : [];
  yield call(() =>
    messageHub.execute.setShowConfiguration({
      start: {
        authorized,
        clock,
        time,
        method,
        uavIds: uavIdsToStartAutomatically,
      },
      duration,
    })
  );

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
function* showSettingsSynchronizerSaga(
  action: ReturnType<typeof synchronizeShowSettings>
) {
  const { payload } = action;

  let success = false;

  yield put(
    setShowSettingsSynchronizationStatus(
      SettingsSynchronizationStatus.IN_PROGRESS
    )
  );

  try {
    if (payload === 'fromServer' || payload === 'toClient') {
      yield pullSettingsFromServer();
      success = true;
    } else if (payload === 'toServer' || payload === 'fromClient') {
      yield pushSettingsToServer();
      success = true;
    }
  } catch (error) {
    console.error(error);
    success = false;
  }

  yield put(
    setShowSettingsSynchronizationStatus(
      success
        ? SettingsSynchronizationStatus.SYNCED
        : SettingsSynchronizationStatus.ERROR
    )
  );
}

/**
 * Compound saga related to the management of the background processes related
 * to drone shows; e.g., the uploading of a show to the drones.
 */
export default createActionListenerSaga({
  [synchronizeShowSettings.type]: showSettingsSynchronizerSaga,
});
