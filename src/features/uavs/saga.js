import isEmpty from 'lodash-es/isEmpty';
import mapValues from 'lodash-es/mapValues';
import { eventChannel } from 'redux-saga';
import { all, call, delay, put, select, take } from 'redux-saga/effects';

import { addUAVs, removeUAVs, updateAgesOfUAVs, updateUAVs } from './slice';

import { getClockSkewInMilliseconds } from '~/features/servers/selectors';
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
 * @return {string} the proposed new age code of the UAV
 */
function proposeAgeCode(lastUpdatedAt, now) {
  const age = lastUpdatedAt ? now - lastUpdatedAt : 600000000;

  if (age >= 600000) {
    /* UAV was not seen for at least 10 minutes; remove it completely */
    /* TODO(ntamas) */
    return UAVAge.GONE;
  }

  if (age >= 60000) {
    /* UAV was not seen for at least a minute */
    return UAVAge.GONE;
  }

  if (age >= 3000) {
    return UAVAge.INACTIVE;
  }

  return UAVAge.ACTIVE;
}

/**
 * Schedules all the given UAVs to be checked whether we have seen a status
 * message from them recently enough.
 */
function updateAgeCodeForUAVs(uavs) {
  const now = Date.now();
  for (const uav of uavs) {
    uav.age = proposeAgeCode(uav.lastUpdatedAt, now);
  }
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

      updateAgeCodeForUAVs(uavs);

      // Dispatch an "added" event immediately - we do not batch these
      emit(['added', additions]);
    }

    function onUAVsRemoved(uavs) {
      const removals = {};

      // If there are any pending updates to the removed UAVs that we have not
      // dispatched yet, remove these updates from the pendingUpdates object.
      for (const uav of uavs) {
        if (uav.id !== undefined) {
          removals[uav.id] = uav;
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
  const chan = yield call(subscribeToFlock, flock);

  while (true) {
    const [command, ...args] = yield take(chan);

    switch (command) {
      case 'added':
        yield put(addUAVs(convertUAVsToRedux(args[0])));
        break;

      case 'removed':
        yield put(removeUAVs(convertUAVsToRedux(args[0])));
        break;

      case 'updated':
        yield put(updateUAVs(convertUAVsToRedux(args[0])));
        break;

      default:
        console.warn(`Unknown command in UAV sync saga: ${command}`);
    }
  }
}

/**
 * Saga that updates the age (status) of the UAVs based on the timestamp we
 * have received an update from them the last time.
 */
function* uavAgingSaga() {
  while (true) {
    yield delay(1000);

    const uavs = yield select((state) => state.uavs.byId);
    const uavIds = yield select((state) => state.uavs.order);
    const clockSkew = (yield select(getClockSkewInMilliseconds)) || 0;

    const now = Date.now() + clockSkew;
    const updates = {};

    for (const uavId of uavIds) {
      const uav = uavs[uavId];
      if (uav) {
        const newAgeCode = proposeAgeCode(uav.lastUpdated, now);
        if (newAgeCode !== uav.age) {
          updates[uavId] = newAgeCode;
        }
      }
    }

    if (!isEmpty(updates)) {
      yield put(updateAgesOfUAVs(updates));
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
  yield all([uavSyncSaga(flock), uavAgingSaga()]);
}
