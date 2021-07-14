import { delay, put, select } from 'redux-saga/effects';

import { shouldOfferTourToUser } from '~/features/tour/selectors';
import { startTour } from '~/features/tour/slice';

/**
 * Compound saga related to the management of the guided tour that appears when
 * the user starts Skybrush for the first time.
 */
export default function* tourManagementSaga() {
  // Wait 3 seconds before we kick in
  yield delay(3000);

  const shouldShowTour = yield select(shouldOfferTourToUser);
  if (shouldShowTour) {
    yield put(startTour());
  }
}
