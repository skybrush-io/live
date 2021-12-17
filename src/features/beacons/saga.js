import { isEmpty } from 'ol/extent';
import { call, delay, put, select } from 'redux-saga/effects';

import { handleError } from '~/error-handling';
import messageHub from '~/message-hub';

import { getBeaconIdsWithoutBasicInformation } from './selectors';
import { setBeaconStateMultiple } from './slice';

export default function* beaconSaga() {
  /* We wait only 1sec here to have a faster response at startup */
  yield delay(1000);

  while (true) {
    const beaconIds = yield select(getBeaconIdsWithoutBasicInformation);

    if (beaconIds.length > 0) {
      let props = null;
      try {
        props = yield call(
          messageHub.query.getBasicBeaconProperties,
          beaconIds
        );
      } catch (error) {
        handleError(error, 'Fetching beacon properties');
      }

      if (props && !isEmpty(props)) {
        yield put(setBeaconStateMultiple(props));
      }
    }

    yield delay(3000);
  }
}
