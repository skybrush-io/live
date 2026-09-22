import isEmpty from 'lodash-es/isEmpty';
import { call, delay, put, select } from 'redux-saga/effects';

import { handleError } from '~/error-handling';
import messageHub from '~/message-hub';
import type { Identifier } from '~/utils/collections';

import { getBeaconIdsWithoutBasicInformation } from './selectors';
import { setBeaconStateMultiple } from './slice';
import type { BeaconPropertiesMap } from './types';

/**
 * Saga that periodically fetches basic properties for beacons that don't have
 * this information yet.
 */
export default function* beaconSaga(): Generator {
  /* We wait only 1sec here to have a faster response at startup */
  yield delay(1000);

  while (true) {
    const beaconIds: Identifier[] = yield select(
      getBeaconIdsWithoutBasicInformation
    );

    if (beaconIds.length > 0) {
      let props: BeaconPropertiesMap | undefined = undefined;
      try {
        props = yield call(
          messageHub.query.getBasicBeaconProperties,
          beaconIds
        );
      } catch (error) {
        handleError(error, { operation: 'Fetching beacon properties' });
      }

      if (props && !isEmpty(props)) {
        yield put(setBeaconStateMultiple(props));
      }
    }

    yield delay(3000);
  }
}
