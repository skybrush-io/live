/**
 * @file Utility file for sharing messaging related code between components.
 */

import countBy from 'lodash-es/countBy';
import isError from 'lodash-es/isError';
import isNil from 'lodash-es/isNil';
import mapValues from 'lodash-es/mapValues';
import values from 'lodash-es/values';

import { showConfirmationDialog } from '~/features/prompt/actions';
import { shouldConfirmUAVOperation } from '~/features/settings/selectors';
import { showNotification } from '~/features/snackbar/slice';
import { MessageSemantics } from '~/features/snackbar/types';
import messageHub from '~/message-hub';
import store from '~/store';

import makeLogger from './logging';

const logger = makeLogger('messaging');

const processResponses = (
  commandName,
  responses,
  { reportSuccess = true, reportFailure = true } = {}
) => {
  responses = values(responses);

  const errorCounts = countBy(responses, isError);
  const numberOfFailures = errorCounts.true || 0;
  const numberOfSuccesses = responses.length - numberOfFailures;

  let message;
  let semantics;

  if (numberOfFailures && reportFailure) {
    semantics = MessageSemantics.ERROR;
    if (numberOfSuccesses > 1) {
      message = `${commandName} sent for ${numberOfSuccesses} UAVs, failed for ${numberOfFailures}`;
    } else if (numberOfSuccesses) {
      message = `${commandName} sent for one UAV, failed for ${numberOfFailures}`;
    } else if (numberOfFailures > 1) {
      message = `${commandName} failed for ${numberOfFailures} UAVs`;
    } else {
      message = `${commandName} failed`;
    }
  } else if (reportSuccess) {
    semantics = MessageSemantics.SUCCESS;
    if (numberOfSuccesses > 1) {
      message = `${commandName} sent for ${numberOfSuccesses} UAVs`;
    } else if (numberOfSuccesses) {
      message = `${commandName} sent successfully`;
    }
  }

  if (message) {
    store.dispatch(
      showNotification({
        message,
        semantics,
      })
    );
  }
};

const createConfirmationMessage = (operation, uavs, broadcast) => {
  const lowercasedOperation = (operation || 'an unknown command').toLowerCase();
  let target;

  if (broadcast) {
    return `Are you sure you want to broadcast ${lowercasedOperation} to all UAVs?`;
  }

  if (!Array.isArray(uavs) || uavs.length === 0) {
    target = '';
  } else if (uavs.length === 1) {
    target = ` on UAV ${uavs[0]}`;
  } else {
    target = ` on ${uavs.length} UAVs`;
  }

  return `Are you sure you want to execute ${lowercasedOperation}${target}?`;
};

const performMassOperation =
  ({
    type,
    name,
    mapper = undefined,
    reportFailure = true,
    reportSuccess = true,
    skipConfirmation = false,
  }) =>
  async (uavs, args) => {
    // Do not bail out early if uavs is empty because in the args there might be
    // an option that intructs the server to do a broadcast to all UAVs.

    try {
      const finalArgs = mapper ? mapper(args) : args;
      const isBroadcast = Boolean(finalArgs?.transport?.broadcast);
      const needsConfirmation =
        !skipConfirmation &&
        shouldConfirmUAVOperation(store.getState(), uavs, isBroadcast);

      if (needsConfirmation) {
        // This operation needs confirmation, so instead of executing it, show
        // a confirmation dialog
        const confirmation = await store.dispatch(
          showConfirmationDialog(
            createConfirmationMessage(name, uavs, isBroadcast),
            { title: 'Confirmation needed' }
          )
        );

        if (!confirmation) {
          return;
        }
      }

      const responses = await messageHub.startAsyncOperation({
        type,
        ids: uavs,
        ...finalArgs,
      });
      processResponses(name, responses, { reportFailure, reportSuccess });
    } catch (error) {
      console.error(error);
      logger.error(`${name}: ${String(error)}`);
    }
  };

export const flashLightOnUAVs = performMassOperation({
  type: 'UAV-SIGNAL',
  name: 'Light signal command',
  mapper: (options) => ({
    signals: ['light'],
    duration: 5000,
    ...options,
  }),
  reportSuccess: false,

  // Light signals are harmless so skip any confirmation dialogs
  skipConfirmation: true,
});

export const flashLightOnUAVsAndHideFailures = performMassOperation({
  type: 'UAV-SIGNAL',
  name: 'Light signal command',
  mapper: (options) => ({
    signals: ['light'],
    duration: 5000,
    ...options,
  }),
  reportSuccess: false,
  reportFailure: false,

  // Light signals are harmless so skip any confirmation dialogs
  skipConfirmation: true,
});

export const takeoffUAVs = performMassOperation({
  type: 'UAV-TAKEOFF',
  name: 'Takeoff command',
});

export const landUAVs = performMassOperation({
  type: 'UAV-LAND',
  name: 'Landing command',
});

export const positionHoldUAVs = performMassOperation({
  type: 'UAV-HOVER',
  name: 'Position hold command',
});

export const returnToHomeUAVs = performMassOperation({
  type: 'UAV-RTH',
  name: 'Return to home command',
});

export const shutdownUAVs = performMassOperation({
  type: 'UAV-HALT',
  name: 'Shutdown command',
});

export const resetUAVs = performMassOperation({
  type: 'UAV-RST',
  name: 'Reset command',
});

export const sleepUAVs = performMassOperation({
  type: 'UAV-SLEEP',
  name: 'Low-power mode command',
});

export const wakeUpUAVs = performMassOperation({
  type: 'UAV-WAKEUP',
  name: 'Resume from low-power mode command',
});

const moveUAVsLowLevel = performMassOperation({
  type: 'UAV-FLY',
  name: 'Fly to target command',
  mapper: ({ target }) => ({
    target: [
      Math.round(target.lat * 1e7),
      Math.round(target.lon * 1e7),
      isNil(target.amsl) ? null : Math.round(target.amsl * 1e3),
      isNil(target.ahl) ? null : Math.round(target.ahl * 1e3),
      isNil(target.agl) ? null : Math.round(target.agl * 1e3),
    ],
  }),

  // Moving UAVs is such a common feature that we skip any confirmation dialogs
  skipConfirmation: true,
});

export const moveUAVs = (uavIds, { target, ...rest }) => {
  if (isNil(target)) {
    throw new Error('No target given in arguments');
  }

  const { lat, lon, amsl, ahl, agl } = target;

  if (!isNil(amsl) && !isNil(ahl) && !isNil(agl)) {
    throw new Error('only one of AMSL, AHL and AGL may be given');
  }

  const args = rest;

  if (!isNil(amsl)) {
    args.target = { lat, lon, amsl };
  } else if (!isNil(ahl)) {
    args.target = { lat, lon, ahl };
  } else if (!isNil(agl)) {
    args.target = { lat, lon, agl };
  } else {
    args.target = { lat, lon };
  }

  return moveUAVsLowLevel(uavIds, args);
};

export const turnMotorsOffForUAVs = performMassOperation({
  type: 'UAV-MOTOR',
  name: 'Motor off command',
  mapper: (options) => ({
    ...options,
    start: false,
  }),
});

export const turnMotorsOnForUAVs = performMassOperation({
  type: 'UAV-MOTOR',
  name: 'Motor on command',
  mapper: (options) => ({
    ...options,
    start: true,
  }),
});

// moveUAVs() not in this map because it requires extra args
const OPERATION_MAP = {
  flashLight: flashLightOnUAVs,
  shutdown: shutdownUAVs,
  land: landUAVs,
  holdPosition: positionHoldUAVs,
  reset: resetUAVs,
  returnToHome: returnToHomeUAVs,
  sleep: sleepUAVs,
  takeOff: takeoffUAVs,
  turnMotorsOff: turnMotorsOffForUAVs,
  turnMotorsOn: turnMotorsOnForUAVs,
  wakeUp: wakeUpUAVs,
};

/**
 * Creates Redux thunks that can be used to dispatch commands to UAVs.
 *
 * @param {function} getTargetedUAVIds  a selector that is invoked with the current
 *        Redux state and that must return the list of UAV IDs that the command
 *        will be targeted to
 * @param {function?} getTransportOptions  an optional selector that is invoked with
 *        the current Redux state and that must return a transport options object
 *        with keys `channel` and `broadcast` to describe how the commands should
 *        be sent to the UAVs (on which channel and whether to be sent in
 *        broadcast mode)
 * @returns  an object mapping UAV operation names from the `OPERATION_MAP`
 *           keys to the corresponding Redux thunks that can be dispatched
 */
export function createUAVOperationThunks({
  getTargetedUAVIds,
  getTransportOptions,
} = {}) {
  if (typeof getTargetedUAVIds !== 'function') {
    throw new TypeError('getTargetedUAVIds() must be a function');
  }

  return mapValues(OPERATION_MAP, (func) => () => (_dispatch, getState) => {
    const state = getState();
    const uavIds = getTargetedUAVIds(state);
    const options = {};

    if (getTransportOptions) {
      options.transport = getTransportOptions(state);

      if (options.transport?.channel === 0) {
        // Work around a bug in older versions of Skybrush Server (2.1.0 and
        // before) where virtual UAVs did not accept a channel index
        delete options.transport.channel;
      }
    }

    func(uavIds, options);
  });
}
