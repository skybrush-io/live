/* eslint-disable complexity, max-depth */

import isEmpty from 'lodash-es/isEmpty';
import isNil from 'lodash-es/isNil';
import mapValues from 'lodash-es/mapValues';
import { eventChannel } from 'redux-saga';
import { all, call, delay, put, select, take } from 'redux-saga/effects';

import { getUAVIdToStateMapping, getUAVIdList } from './selectors';
import {
  addUAVs,
  updateAgesOfUAVs,
  updateUAVs,
  _removeUAVsByIds,
} from './slice';

import { dismissAlerts, triggerAlert } from '~/features/alert/slice';
import { getRoundedClockSkewInMilliseconds } from '~/features/servers/selectors';
import { getUAVAgingThresholds } from '~/features/settings/selectors';
import { isErrorCodeOrMoreSevere } from '~/model/status-codes';
import { UAVAge } from '~/model/uav';

/**
 * Helper function to convert a single UAV to its Redux representation.
 */
const convertUAVToRedux = (uav) => uav.toJSON();

/**
 * Helper function to convert an object mapping UAV IDs to their corresponding
 * UAVs to an object mapping UAV IDs to their corresponding Redux
 * representations.
 */
const convertUAVsToRedux = (objects) => mapValues(objects, convertUAVToRedux);

/**
 * Returns a proposed age code for a UAV, given the time when it was last
 * updated and the current timestamp.
 *
 * @param  {number}  lastUpdatedAt  the time when the UAV was updated the
 *         last time
 * @param  {number}  now  the current timestamp, in milliseconds
 * @param  {number}  warnThreshold  number of milliseconds after which a UAV goes
 *         into the "no telemetry" state
 * @param  {number}  goneThreshold  number of milliseconds after which a UAV goes
 *         into the "gone" state
 * @param  {number}  forgetThreshold  number of milliseconds after which a UAV
 *         is "forgotten" and removed from the client
 * @return {string} the proposed new age code of the UAV, or an empty string if
 *         the UAV should be removed
 */
function proposeAgeCode(
  lastUpdatedAt,
  now,
  { warnThreshold, goneThreshold, forgetThreshold }
) {
  const age = lastUpdatedAt ? now - lastUpdatedAt : 600000000;

  if (age > forgetThreshold) {
    /* UAV was not seen for a very long time; remove it completely */
    return UAVAge.FORGOTTEN;
  }

  if (age > goneThreshold) {
    /* UAV was not seen for a while, mark it as "gone" */
    return UAVAge.GONE;
  }

  if (age > warnThreshold) {
    return UAVAge.INACTIVE;
  }

  return UAVAge.ACTIVE;
}

/**
 * Subscribes to events originating from the given flock, putting appropriate
 * messages on a channel that leads back to the flock-to-Redux synchromizer
 * saga.
 *
 * @param  {Flock} flock  the flock to subscribe to
 * @return an appropriate Redux channel
 */
function subscribeToFlock(flock) {
  return eventChannel((emit) => {
    let updateTimer = null;
    let pendingUpdates = {};

    /**
     * Flushes all pending updates of the UAVs to the Redux state store.
     */
    function flushUpdates() {
      // If there was at least one update, send an event and then schedule the
      // next call.
      if (!isEmpty(pendingUpdates)) {
        emit(['updated', pendingUpdates]);
        updateTimer = setTimeout(flushUpdates, 500);
      } else {
        updateTimer = null;
      }

      // Clear the updates.
      //
      // Note that we don't use the delete operator to clear the updates. This
      // is intentional; deleting properties would convert the objects from
      // fast to slow mode in the V8 JS engine.
      pendingUpdates = {};
    }

    /**
     * If there is no pending scheduled flushUpdates() call, calls it
     * immediately and then schedules a new one. Otherwise does nothing.
     */
    function scheduleFlushUpdates() {
      if (updateTimer === null) {
        flushUpdates();
        updateTimer = setTimeout(flushUpdates, 500);
      } else {
        // There is a scheduled time for sending a new batch so do nothing
      }
    }

    function onUAVsAdded(uavs) {
      const additions = {};

      for (const uav of uavs) {
        if (uav.id !== undefined) {
          uav.age = UAVAge.ACTIVE;
          additions[uav.id] = uav;
        }
      }

      // Dispatch an "added" event immediately - we do not batch these
      emit(['added', additions]);
    }

    function onUAVsRemoved(uavs) {
      const removals = [];

      // If there are any pending updates to the removed UAVs that we have not
      // dispatched yet, remove these updates from the pendingUpdates object.
      for (const uav of uavs) {
        if (uav.id !== undefined) {
          removals.push(uav);
          delete pendingUpdates[uav.id];
        }
      }

      // Dispatch a "removed" event immediately - we do not batch these
      emit(['removed', removals]);
    }

    function onUAVsUpdated(uavs) {
      // Update events are batched
      for (const uav of uavs) {
        pendingUpdates[uav.id] = uav;
      }

      scheduleFlushUpdates();
    }

    const bindings = {
      uavsAdded: flock.uavsAdded.add(onUAVsAdded),
      uavsRemoved: flock.uavsRemoved.add(onUAVsRemoved),
      uavsUpdated: flock.uavsUpdated.add(onUAVsUpdated),
    };

    return () => {
      flock.uavsAdded.detach(bindings.uavsAdded);
      flock.uavsRemoved.detach(bindings.uavsRemoved);
      flock.uavsUpdated.detach(bindings.uavsUpdated);

      if (updateTimer !== null) {
        clearTimeout(updateTimer);
      }
    };
  });
}

/**
 * Saga that updates the status of the UAVs in the Redux store based on the
 * status updates received from the given flock object.
 *
 * @param {Flock} flock  the UAV flock whose members should be synchronized with
 *        the Redux store
 */
function* uavSyncSaga(flock) {
  // Mapping that maps UAV IDs to the maximum of error codes seen for that UAV.
  // Triggers an alert if a new UAV appears or if the maximum changes for a UAV.
  const uavToMostSevereError = new Map();
  let hasErrors = false;
  let shouldTriggerAlert;
  let uavs;
  let uavIds;
  const chan = yield call(subscribeToFlock, flock);

  while (true) {
    const [command, ...args] = yield take(chan);

    uavs = null;
    uavIds = null;
    hasErrors = uavToMostSevereError.size > 0;
    shouldTriggerAlert = false;

    switch (command) {
      case 'added':
        uavs = convertUAVsToRedux(args[0]);
        yield put(addUAVs(uavs));
        break;

      case 'removed':
        uavIds = args[0].map((uav) => uav.id);
        yield put(_removeUAVsByIds(uavIds));

        if (hasErrors) {
          for (const uavId of uavIds) {
            uavToMostSevereError.delete(uavId);
          }
        }

        break;

      case 'updated':
        uavs = convertUAVsToRedux(args[0]);
        yield put(updateUAVs(uavs));
        break;

      default:
        console.warn(`Unknown command in UAV sync saga: ${command}`);
    }

    // If we updated some UAVs, check their most severe error codes
    if (uavs) {
      // In 99% of the cases the uavToMostSevereError map is empty so we provide
      // an optimized branch for this case that does not deal with removals
      if (!hasErrors) {
        for (const [uavId, uav] of Object.entries(uavs)) {
          const maxErrorCode =
            uav.errors.length > 0 ? Math.max(...uav.errors) : 0;
          if (isErrorCodeOrMoreSevere(maxErrorCode)) {
            uavToMostSevereError.set(uavId, maxErrorCode);
            shouldTriggerAlert = true;
            hasErrors = true;
          }
        }
      } else {
        // TODO(ntamas): finish this branch!
        for (const [uavId, uav] of Object.entries(uavs)) {
          const maxErrorCode =
            uav.errors.length > 0 ? Math.max(...uav.errors) : 0;
          if (isErrorCodeOrMoreSevere(maxErrorCode)) {
            const previousErrorCode = uavToMostSevereError.get(uavId);
            if (isNil(previousErrorCode) || previousErrorCode < maxErrorCode) {
              uavToMostSevereError.set(uavId, maxErrorCode);
              shouldTriggerAlert = true;
            }
          } else {
            if (uavToMostSevereError.has(uavId)) {
              uavToMostSevereError.delete(uavId);
            }
          }
        }
      }
    }

    if (hasErrors && uavToMostSevereError.size <= 0) {
      // We had some errors but they were resolved so we can dismiss the alerts
      yield put(dismissAlerts());
    }

    if (shouldTriggerAlert) {
      // Some alerts were newly triggered
      yield put(triggerAlert());
    }
  }
}

/**
 * Saga that updates the age (status) of the UAVs based on the timestamp we
 * have received an update from them the last time.
 */
function* uavAgingSaga(flock) {
  while (true) {
    yield delay(1000);

    const uavs = yield select(getUAVIdToStateMapping);
    const uavIds = yield select(getUAVIdList);
    const clockSkew = (yield select(getRoundedClockSkewInMilliseconds)) || 0;
    const thresholds = yield select(getUAVAgingThresholds);

    const now = Date.now() + clockSkew;
    const updates = {};
    const removals = [];

    for (const uavId of uavIds) {
      const uav = uavs[uavId];
      if (uav) {
        const newAgeCode = proposeAgeCode(uav.lastUpdated, now, thresholds);
        if (newAgeCode === UAVAge.FORGOTTEN) {
          removals.push(uavId);
        } else if (newAgeCode !== uav.age) {
          updates[uavId] = newAgeCode;
        }
      }
    }

    if (!isEmpty(updates)) {
      yield put(updateAgesOfUAVs(updates));
    }

    if (removals.length > 0) {
      /* Rmove the UAVs from the subscribed flock; the flock will then dispatch
       * events, which will in turn make the uavSyncSaga invoke removeUAVsByIds
       * as needed */
      flock.removeUAVsByIds(removals);
    }
  }
}

/**
 * Compound saga related to the management of the connection to the upstream
 * Skybrush server.
 *
 * @param {Flock} flock  the UAV flock whose members should be synchronized with
 *        the Redux store
 */
export default function* uavManagementSaga(flock) {
  yield all([uavSyncSaga(flock), uavAgingSaga(flock)]);
}
