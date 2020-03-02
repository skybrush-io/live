import isEmpty from 'lodash-es/isEmpty';
import mapValues from 'lodash-es/mapValues';
import { eventChannel } from 'redux-saga';
import { call, put, take } from 'redux-saga/effects';
import TimerSet from 'tick-tock';

import { addUAVs, removeUAVs, updateAgesOfUAVs, updateUAVs } from './slice';

import { UAVAge } from '~/model/uav';

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
    const updateTimer = Symbol('update');
    const timers = new TimerSet();
    const lastUpdated = {};
    let pendingUpdates = {};
    let pendingAgeOnlyUpdates = {};

    /**
     * Checks whether we have seen a status message from the UAV with the given
     * ID recently enough.
     *
     * @param  {string} uavId  the ID of the UAV to check
     * @param  {float}  now    the current timestamp, in milliseconds
     */
    function checkUAVAgingById(uavId) {
      let timeUntilNextCheck = -1;

      const age =
        uavId && lastUpdated[uavId]
          ? Date.now() - lastUpdated[uavId]
          : 600000000;

      if (age >= 600000) {
        /* UAV was not seen for at least 10 minutes; remove it completely */
        /* TODO(ntamas) */
        console.warn('UAV', uavId, 'should be removed');
        timeUntilNextCheck = -1;
      } else if (age >= 60000) {
        /* UAV was not seen for at least a minute -- it has to be marked as
         * gone and then checked again in 9 minutes */
        onUAVAgeUpdated(uavId, UAVAge.GONE);
        timeUntilNextCheck = 9 * 60000;
      } else if (age >= 3000) {
        /* UAV was not seen for at least 3 seconds -- it has to be marked as
         * inactive and then checked again in 57 seconds */
        onUAVAgeUpdated(uavId, UAVAge.INACTIVE);
        timeUntilNextCheck = 57000;
      } else {
        /* UAV was seen recently -- check again at the time when it would
         * become inactive */
        timeUntilNextCheck = 3000 - age;
      }

      if (timeUntilNextCheck >= 0) {
        if (timers.active(uavId)) {
          timers.clear(uavId);
        }

        timers.setTimeout(
          uavId,
          () => checkUAVAgingById(uavId),
          timeUntilNextCheck
        );
      }
    }

    /**
     * Schedules all the given UAVs to be checked whether we have seen a status
     * message from them recently enough.
     */
    function scheduleUAVAging(uavs) {
      for (const uav of uavs) {
        checkUAVAgingById(uav.id);
      }
    }

    /**
     * Unschedules all the given UAVs so we don't check them for recent status
     * messages any more.
     */
    function unscheduleUAVAging(uavs) {
      timers.clear(...uavs.map(uav => uav.id));
    }

    /**
     * Flushes all pending updates of the UAVs to the Redux state store.
     */
    function flushUpdates() {
      // There is at least one update, so send an event, and clear the updates.
      //
      // Note that we don't use the delete operator to clear the updates. This
      // is intentional; deleting properties would convert the objects from
      // fast to slow mode in the V8 JS engine.
      emit(['updated', pendingUpdates]);

      if (!isEmpty(pendingAgeOnlyUpdates)) {
        emit(['aged', pendingAgeOnlyUpdates]);
      }

      // Kickstart the aging check again for the updated UAVs -- this is needed
      // to resume checking when a UAV returns from the "gone" state
      for (const uav of Object.values(pendingUpdates)) {
        checkUAVAgingById(uav.id);
      }

      pendingUpdates = {};
      pendingAgeOnlyUpdates = {};
    }

    /**
     * If there is no pending scheduled flushUpdates() call, calls it
     * immediately and then schedules a new one. Otherwise does nothing.
     */
    function scheduleFlushUpdates() {
      if (!timers.active(updateTimer)) {
        flushUpdates();
        timers.setTimeout(updateTimer, flushUpdates, 500);
      } else {
        // There is a scheduled time for sending a new batch so do nothing
      }
    }

    function onUAVAgeUpdated(uavId, age) {
      console.warn(`UAV ${uavId} is now ${age}`);
      if (pendingUpdates[uavId]) {
        pendingUpdates[uavId].age = age;
      } else {
        pendingAgeOnlyUpdates[uavId] = age;
      }

      scheduleFlushUpdates();
    }

    function onUAVsAdded(uavs) {
      const additions = {};

      for (const uav of uavs) {
        if (uav.id !== undefined) {
          uav.age = UAVAge.ACTIVE;
          additions[uav.id] = uav;
          lastUpdated[uav.id] = uav.lastUpdated;
        }
      }

      // Dispatch an "added" event immediately - we do not batch these
      emit(['added', additions]);

      // Schedule the aging of the UAVs
      scheduleUAVAging(uavs);
    }

    function onUAVsRemoved(uavs) {
      const removals = {};

      // If there are any pending updates to the removed UAVs that we have not
      // dispatched yet, remove these updates from the pendingUpdates object.
      for (const uav of uavs) {
        if (uav.id !== undefined) {
          removals[uav.id] = uav;
          delete lastUpdated[uav.id];
          delete pendingUpdates[uav.id];
        }
      }

      // Dispatch a "removed" event immediately - we do not batch these
      emit(['removed', removals]);

      // Unschedule the aging of the UAVs in the timer wheel
      unscheduleUAVAging(uavs);
    }

    function onUAVsUpdated(uavs) {
      // Update events are batched
      for (const uav of uavs) {
        lastUpdated[uav.id] = uav.lastUpdated;
        pendingUpdates[uav.id] = uav;
        delete pendingAgeOnlyUpdates[uav.id];
      }

      scheduleFlushUpdates();
    }

    const bindings = {
      uavsAdded: flock.uavsAdded.add(onUAVsAdded),
      uavsRemoved: flock.uavsRemoved.add(onUAVsRemoved),
      uavsUpdated: flock.uavsUpdated.add(onUAVsUpdated)
    };

    return () => {
      flock.uavsAdded.detach(bindings.uavsAdded);
      flock.uavsRemoved.detach(bindings.uavsRemoved);
      flock.uavsUpdated.detach(bindings.uavsUpdated);

      timers.end();
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

      case 'aged':
        yield put(updateAgesOfUAVs(args[0]));
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
