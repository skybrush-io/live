/**
 * @file Utility file for sharing messaging related code between components.
 */

import type { TransportOptions } from '@skybrush/flockwave-spec';
import countBy from 'lodash-es/countBy';
import isError from 'lodash-es/isError';
import isNil from 'lodash-es/isNil';
import mapValues from 'lodash-es/mapValues';
import values from 'lodash-es/values';

import { showConfirmationDialog } from '~/features/prompt/actions';
import { UAV_SIGNAL_DURATION } from '~/features/settings/constants';
import { shouldConfirmUAVOperation } from '~/features/settings/selectors';
import { showNotification } from '~/features/snackbar/actions';
import { MessageSemantics } from '~/features/snackbar/types';
import { COMPASS_CALIB_TIMEOUT } from '~/features/uavs/constants';
import type { StartAsyncOperationOptions } from '~/flockwave/messages';
import messageHub from '~/message-hub';
import { NULL_ISLAND, type GPSPosition } from '~/model/geography';
import store from '~/store';
import type {
  AppDispatch,
  AppSelector,
  AppThunk,
  RootState,
} from '~/store/reducers';

import handleError from '~/error-handling';
import makeLogger from './logging';

const logger = makeLogger('messaging');

const processResponses = (
  commandName: string,
  responseMap: Record<string, unknown>,
  {
    reportSuccess = true,
    reportFailure = true,
  }: { reportSuccess?: boolean; reportFailure?: boolean } = {}
) => {
  const responses = values(responseMap);

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
    showNotification({
      message,
      semantics,
    });
  }
};

const createConfirmationMessage = (
  operation: string,
  uavs: string[],
  broadcast: boolean
) => {
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

type MassOperationOptions<T = unknown, U = unknown> = {
  type: string;
  name: string;
  mapper?: (args: T) => U;
  reportFailure?: boolean;
  reportSuccess?: boolean;
  skipConfirmation?: boolean;
};

function performMassOperation<T, U>(
  {
    type,
    name,
    mapper = undefined,
    reportFailure = true,
    reportSuccess = true,
    skipConfirmation = false,
  }: MassOperationOptions<T, U>,
  responseHandlerOptions?: StartAsyncOperationOptions
) {
  return async (
    uavs: string[],
    args: T & { transport?: TransportOptions | undefined }
  ) => {
    // Do not bail out early if uavs is empty because in the args there might be
    // an option that intructs the server to do a broadcast to all UAVs.

    try {
      const finalArgs = mapper ? mapper(args) : args;
      const isBroadcast = Boolean(
        (finalArgs as { transport?: TransportOptions })?.transport?.broadcast
      );
      const needsConfirmation =
        !skipConfirmation &&
        shouldConfirmUAVOperation(
          store.getState() as RootState,
          uavs,
          isBroadcast
        );

      if (needsConfirmation) {
        // This operation needs confirmation, so instead of executing it, show
        // a confirmation dialog
        const confirmation = await (store.dispatch as AppDispatch)(
          showConfirmationDialog(
            createConfirmationMessage(name, uavs, isBroadcast),
            { title: 'Confirmation needed' }
          )
        );

        if (!confirmation) {
          return;
        }
      }

      const responses = await messageHub.startAsyncOperation(
        {
          type,
          ids: uavs,
          ...finalArgs,
        },
        responseHandlerOptions
      );
      processResponses(name, responses, { reportFailure, reportSuccess });
    } catch (error) {
      console.error(error);
      logger.error(`${name}: ${String(error)}`);
    }
  };
}

export const flashLightOnUAVs = performMassOperation({
  type: 'UAV-SIGNAL',
  name: 'Light signal command',
  mapper: (options: { duration?: number }) => ({
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
  mapper: (options: { duration?: number }) => ({
    signals: ['light'],
    duration: UAV_SIGNAL_DURATION * 1000,
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

export const setColorOnUAVs = performMassOperation({
  type: 'OBJ-CMD',
  name: 'Set color command',
  mapper: (options: { color: string }) => ({
    command: 'color',
    args: [options.color],
  }),
  reportSuccess: false,

  // Light signals are harmless so skip any confirmation dialogs
  skipConfirmation: true,
});

export const turnOffColorOverrideOnUAVs = performMassOperation({
  type: 'OBJ-CMD',
  name: 'Set color command',
  mapper: () => ({
    command: 'color',
    args: ['off'],
  }),
  reportSuccess: false,

  // Light signals are harmless so skip any confirmation dialogs
  skipConfirmation: true,
});

type MoveUAVsLowLevelOptions = {
  target: GPSPosition;
};

const moveUAVsLowLevel = performMassOperation({
  type: 'UAV-FLY',
  name: 'Fly to target command',
  mapper: ({ target }: MoveUAVsLowLevelOptions) => ({
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

export const moveUAVs = (
  uavIds: string[],
  { target, ...rest }: { target: GPSPosition }
) => {
  if (isNil(target)) {
    throw new Error('No target given in arguments');
  }

  const { lat, lon, amsl, ahl, agl } = target;

  if (!isNil(amsl) && !isNil(ahl) && !isNil(agl)) {
    throw new Error('only one of AMSL, AHL and AGL may be given');
  }

  const args: MoveUAVsLowLevelOptions = { target: NULL_ISLAND, ...rest };

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
  mapper: (options: { force?: boolean } = {}) => ({
    ...options,
    start: false,
  }),
});

export const turnMotorsOnForUAVs = performMassOperation({
  type: 'UAV-MOTOR',
  name: 'Motor on command',
  mapper: (options: { force?: boolean } = {}) => ({
    ...options,
    start: true,
  }),
});

export const calibrateCompassOnUAVs = performMassOperation(
  {
    type: 'UAV-CALIB',
    name: 'Calibrate compass',
    mapper: ({
      transport,
      ...options
    }: { transport?: TransportOptions } = {}) => ({
      // Ignore transport, it's not a valid argument.
      ...options,
      component: 'compass',
    }),
  },
  { timeout: COMPASS_CALIB_TIMEOUT }
);

type OperationHandler<T extends object = object> = (
  uavs: string[],
  args: T & { transport?: TransportOptions }
) => Promise<void>;

// moveUAVs() and setColor() are not in this map because they require extra args
const OPERATION_MAP: Record<string, OperationHandler<object>> = {
  calibrateCompass: calibrateCompassOnUAVs,
  flashLight: flashLightOnUAVs,
  holdPosition: positionHoldUAVs,
  land: landUAVs,
  reset: resetUAVs,
  returnToHome: returnToHomeUAVs,
  shutdown: shutdownUAVs,
  sleep: sleepUAVs,
  takeOff: takeoffUAVs,
  turnMotorsOff: turnMotorsOffForUAVs,
  turnMotorsOn: turnMotorsOnForUAVs,
  wakeUp: wakeUpUAVs,
};

/**
 * Creates a Redux thunk that can be used to dispatch a command to UAVs.
 */
export function createUAVOperationThunk<T extends object>(
  func: OperationHandler<T>,
  {
    getTargetedUAVIds,
    getTransportOptions,
  }: {
    getTargetedUAVIds: AppSelector<string[]>;
    getTransportOptions?: AppSelector<TransportOptions>;
  }
) {
  if (typeof getTargetedUAVIds !== 'function') {
    throw new TypeError('getTargetedUAVIds() must be a function');
  }

  return (args?: Parameters<typeof func>[1]): AppThunk =>
    (_dispatch, getState) => {
      const state = getState();
      const uavIds = getTargetedUAVIds(state);
      const options: Parameters<typeof func>[1] & {
        transport?: TransportOptions;
      } = { ...(args ?? {}) } as any as Parameters<typeof func>[1];

      if (getTransportOptions) {
        options.transport = getTransportOptions(state);

        if (options.transport?.channel === 0) {
          // Work around a bug in older versions of Skybrush Server (2.1.0 and
          // before) where virtual UAVs did not accept a channel index
          delete options.transport.channel;
        }
      }

      func(uavIds, options).catch(handleError);
    };
}

/**
 * Creates Redux thunks that can be used to dispatch commands to UAVs.
 *
 * @param getTargetedUAVIds  a selector that is invoked with the current
 *        Redux state and that must return the list of UAV IDs that the command
 *        will be targeted to
 * @param getTransportOptions  an optional selector that is invoked with
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
}: {
  getTargetedUAVIds: AppSelector<string[]>;
  getTransportOptions?: AppSelector<TransportOptions>;
}) {
  return mapValues(
    OPERATION_MAP,
    (func) => (): AppThunk => (_dispatch, getState) => {
      const state = getState();
      const uavIds = getTargetedUAVIds(state);
      const options: { transport?: TransportOptions } = {};

      if (getTransportOptions) {
        options.transport = getTransportOptions(state);

        if (options.transport?.channel === 0) {
          // Work around a bug in older versions of Skybrush Server (2.1.0 and
          // before) where virtual UAVs did not accept a channel index
          delete options.transport.channel;
        }
      }

      func(uavIds, options).catch(handleError);
    }
  );
}
