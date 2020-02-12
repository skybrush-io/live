import { call, cancelled, delay, put, race, take } from 'redux-saga/effects';
import { cancelUpload, notifyUploadFinished, startUpload } from './slice';

/**
 * Saga that handles the uploading of the show to a set of drones.
 */
function* showUploadSaga() {
  try {
    console.log('Upload started');
    yield delay(5000);
    console.log('Upload finished');
  } finally {
    if (yield cancelled()) {
      console.log('Upload cancelled');
    }
  }
}

/**
 * Compound saga related to the management of the background processes related
 * to drone shows; e.g., the uploading of a show to the drones.
x */
export default function* showSaga() {
  while (yield take(startUpload)) {
    const result = yield race({
      finished: call(showUploadSaga),
      cancelled: take(cancelUpload)
    });

    if (result.cancelled) {
      yield put(notifyUploadFinished());
    } else {
      yield put(notifyUploadFinished());
    }
  }
}
