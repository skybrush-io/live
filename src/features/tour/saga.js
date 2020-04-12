import { delay, select } from 'redux-saga/effects';

import { shouldOfferTourToUser } from '~/features/tour/selectors';

/**
 * Compound saga related to the management of the guided tour that appears when
 * the user starts Skybrush for the first time.
 */
export default function* tourManagementSaga(flock) {
  // Wait 3 seconds before we kick in
  yield delay(3000);

  const shouldShow = yield select(shouldOfferTourToUser);
  if (shouldShow) {
    console.log('Tour should start now');
  }
}
