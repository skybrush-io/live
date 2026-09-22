import { delay, put, takeLatest } from 'redux-saga/effects';

import { clearPendingUAVId } from './actions';
import { startPendingUAVIdTimeout } from './slice';

function* handlePendingUAVIdTimeout() {
  yield delay(5000);
  yield put(clearPendingUAVId());
}

function* hotkeySaga() {
  yield takeLatest(startPendingUAVIdTimeout.type, handlePendingUAVIdTimeout);
}

export default hotkeySaga;
