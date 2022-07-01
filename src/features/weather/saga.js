import { delay, put, putResolve, race, select, take } from 'redux-saga/effects';

import { updateMapViewSettings } from '~/features/map/view';
import { isConnected } from '~/features/servers/selectors';
import { setCurrentServerConnectionState } from '~/features/servers/slice';
import { getMapViewCenterPosition } from '~/selectors/map';

import { updateWeatherData } from './actions';
import { getWeatherDataLastUpdateTimestamp } from './selectors';
import { setLastUpdateTimestamp, setLastUpdateAttemptTimestamp } from './slice';

const MINUTES = 60 * 1000;

/**
 * Saga related to the background update of the weather information from the
 * upstream Skybrush server.
 */
export default function* weatherSaga() {
  while (true) {
    let successful;
    const connected = yield select(isConnected);

    if (connected) {
      successful = false;
      try {
        yield put(setLastUpdateAttemptTimestamp(Date.now()));
        const center = yield select(getMapViewCenterPosition);
        yield putResolve(updateWeatherData(center));
        successful = true;
      } catch {
        /* do nothing, it was handled already by an error action in redux-promise-middleware */
      }

      if (successful) {
        yield put(setLastUpdateTimestamp(Date.now()));
      }
    }

    // Calculate how much time we need to wait until the next update. We aim to
    // update the weather info every 30 minutes; however, if 30 minutes has
    // elapsed and there are still errors while querying, we try again once
    // every minute only
    const lastUpdatedAt = yield select(getWeatherDataLastUpdateTimestamp);
    const timeUntilNextRefresh = lastUpdatedAt
      ? lastUpdatedAt + 30 * MINUTES - Date.now()
      : 0;

    // TODO(ntamas): we must also update the weather display if the user scrolls
    // to a new area on the map
    yield race({
      action: take([
        // Trigger an update if the state of the server connection changes
        setCurrentServerConnectionState.type,
        // Also trigger an update if the user scrolls to a new position
        updateMapViewSettings.type,
      ]),
      refresh: delay(Math.max(timeUntilNextRefresh, MINUTES)),
    });
  }
}
