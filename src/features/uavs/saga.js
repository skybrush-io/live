import isEmpty from 'lodash-es/isEmpty';
import mapValues from 'lodash-es/mapValues';
import { eventChannel } from 'redux-saga';
import { call, put, take } from 'redux-saga/effects';

import { addUAVs, removeUAVs, updateUAVs } from './slice';

/**
 * Helper function to convert a single UAV to its Redux representation.
 */
const convertUAVToRedux = uav => uav.toJSON();

/**
 * Helper function to convert an object mapping UAV IDs to their corresponding
 * UAVs to an object mapping UAV IDs to their corresponding Redux
 * representations.
 */
const convertUAVsToRedux = objects => mapValues(objects, convertUAVToRedux);

/**
 * Subscribes to events originating from the given flock, putting appropriate
 * messages on a channel that leads back to the flock-to-Redux synchromizer
 * saga.
 *
 * @param  {Flock} flock  the flock to subscribe to
 * @return an appropriate Redux channel
 */
function subscribeToFlock(flock) {
  return eventChannel(emit => {
    let pendingUpdates = {};
    let nextBatchTimerHandle;

    function flushUpdates() {
      if (isEmpty(pendingUpdates)) {
        // No pending updates. We can suspend batching until we get an update
        // event again.
        if (nextBatchTimerHandle) {
          clearInterval(nextBatchTimerHandle);
          nextBatchTimerHandle = undefined;
        }
      } else {
        // There is at least one update, so send an event, clear the updates
        // and then return.
        //
        // Note that we don't use the delete operator to clear the object. THis
        // is intentional; deleting properties would convert the object from
        // fast to slow mode in the V8 JS engine.
        emit(['updated', pendingUpdates]);
        pendingUpdates = {};
      }
    }

    function onUAVsAdded(uavs) {
      const additions = {};

      for (const uav of uavs) {
        if (uav.id !== undefined) {
          additions[uav.id] = uav;
        }
      }

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

      if (nextBatchTimerHandle === undefined) {
        flushUpdates();
        nextBatchTimerHandle = setInterval(flushUpdates, 500);
      } else {
        // There is a scheduled time for sending a new batch so do nothing
      }
    }

    flock.uavsAdded.add(onUAVsAdded);
    flock.uavsRemoved.add(onUAVsRemoved);
    flock.uavsUpdated.add(onUAVsUpdated);

    return () => {
      flock.uavsAdded.detach(onUAVsAdded);
      flock.uavsRemoved.detach(onUAVsRemoved);
      flock.uavsUpdated.detach(onUAVsUpdated);
    };
  });
}

/**
 * Compound saga related to the management of the connection to the upstream
 * Skybrush server.
 *
 * @param {Flock} flock  the UAV flock whose members should be synchronized with
 *        the Redux store
 */
export default function* uavSyncSaga(flock) {
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
