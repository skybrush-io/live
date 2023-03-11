import isEmpty from 'lodash-es/isEmpty';
import pick from 'lodash-es/pick';
import { cancel, fork, put, select, take } from 'redux-saga/effects';

import { addNewSamplesToAveraging } from '~/features/measurement/actions';
import {
  getActiveUAVIdsBeingAveraged,
  hasActiveAveragingMeasurements,
} from '~/features/measurement/selectors';
import {
  startAveragingUAVCoordinateById,
  pauseAveragingUAVCoordinatesByIds,
  restartAveragingUAVCoordinatesByIds,
  resumeAveragingUAVCoordinatesByIds,
  stopAveragingUAVCoordinatesByIds,
} from '~/features/measurement/slice';

import { updateUAVs } from '~/features/uavs/slice';

/**
 * Saga related to the management of the data collection corresponding
 * to the position averaging measurements that we can perform on the UAVs.
 *
 * This saga is executed only if there is at least one UAV for which we need
 * to average its position.
 */
export function* positionAveragingSaga() {
  while (true) {
    const { payload } = yield take(updateUAVs.type);
    const uavIds = yield select(getActiveUAVIdsBeingAveraged);
    const newSamples = {};

    for (const uavId of uavIds) {
      const item = payload[uavId];
      if (item) {
        newSamples[uavId] = pick(item.position, ['lat', 'lon', 'amsl', 'ahl']);
      }
    }

    if (!isEmpty(newSamples)) {
      yield put(addNewSamplesToAveraging(newSamples));
    }
  }
}

/**
 * Compound saga related to the management of the data collection corresponding
 * to the position averaging measurements that we can perform on the UAVs.
 */
export default function* measurementSaga() {
  let averagingTask = null;

  while (true) {
    const active = yield select(hasActiveAveragingMeasurements);

    if (active) {
      if (!averagingTask) {
        averagingTask = yield fork(positionAveragingSaga);
      }
    } else if (averagingTask) {
      yield cancel(averagingTask);
      averagingTask = null;
    }

    yield take([
      startAveragingUAVCoordinateById.type,
      stopAveragingUAVCoordinatesByIds.type,
      pauseAveragingUAVCoordinatesByIds.type,
      restartAveragingUAVCoordinatesByIds.type,
      resumeAveragingUAVCoordinatesByIds.type,
    ]);
  }
}
