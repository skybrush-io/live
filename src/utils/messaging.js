/**
 * @file Utility file for sharing messaging related code between components.
 */

import countBy from 'lodash-es/countBy';
import isError from 'lodash-es/isError';
import isNil from 'lodash-es/isNil';
import values from 'lodash-es/values';

import messageHub from '~/message-hub';
import { showNotification } from '~/features/snackbar/slice';
import { MessageSemantics } from '~/features/snackbar/types';
import store from '~/store';

import makeLogger from './logging';

const logger = makeLogger('messaging');

const processResponses = (commandName, responses, { silent } = {}) => {
  responses = values(responses);

  const errorCounts = countBy(responses, isError);
  const numberOfFailures = errorCounts.true || 0;
  const numberOfSuccesses = responses.length - numberOfFailures;

  let message;
  let semantics;

  if (numberOfFailures) {
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
  } else if (!silent) {
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

const performMassOperation = ({
  type,
  name,
  mapper = undefined,
  silent,
}) => async (uavs, args) => {
  try {
    const responses = await messageHub.startAsyncOperation({
      type,
      ids: uavs,
      ...(mapper ? mapper(args) : args),
    });
    processResponses(name, responses, { silent });
  } catch (error) {
    console.error(error);
    logger.error(`${name}: ${String(error)}`);
  }
};

export const flashLightOnUAVs = performMassOperation({
  type: 'UAV-SIGNAL',
  name: 'Light signal command',
  mapper: () => ({
    signals: ['light'],
    duration: 5000,
  }),
  silent: true,
});

export const takeoffUAVs = performMassOperation({
  type: 'UAV-TAKEOFF',
  name: 'Takeoff command',
});

export const landUAVs = performMassOperation({
  type: 'UAV-LAND',
  name: 'Landing command',
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

const moveUAVsLowLevel = performMassOperation({
  type: 'UAV-FLY',
  name: 'Fly to target command',
  mapper: ({ target }) => ({
    target: [
      Math.round(target.lat * 1e7),
      Math.round(target.lon * 1e7),
      isNil(target.amsl) ? null : Math.round(target.amsl * 1e3),
      isNil(target.agl) ? null : Math.round(target.agl * 1e3),
    ],
  }),
});

export const moveUAVs = (uavIds, { target, ...rest }) => {
  if (isNil(target)) {
    throw new Error('No target given in arguments');
  }

  const { lat, lon, amsl, agl } = target;

  if (!isNil(amsl) && !isNil(agl)) {
    throw new Error('only one of AMSL and AGL may be given');
  }

  const args = rest;

  if (!isNil(amsl)) {
    args.target = { lat, lon, amsl };
  } else if (!isNil(agl)) {
    args.target = { lat, lon, agl };
  } else {
    args.target = { lat, lon };
  }

  return moveUAVsLowLevel(uavIds, args);
};

export const turnMotorOnForUAVs = performMassOperation({
  type: 'UAV-MOTOR',
  name: 'Motor on command',
  mapper: () => ({
    start: true,
  }),
});

export const createSelectionRelatedActions = (selectedUAVIds) => ({
  flashLightOnSelectedUAVs: () => {
    flashLightOnUAVs(selectedUAVIds);
  },

  haltSelectedUAVs: () => {
    shutdownUAVs(selectedUAVIds);
  },

  landSelectedUAVs: () => {
    landUAVs(selectedUAVIds);
  },

  resetSelectedUAVs: () => {
    resetUAVs(selectedUAVIds);
  },

  returnToHomeSelectedUAVs: () => {
    returnToHomeUAVs(selectedUAVIds);
  },

  takeoffSelectedUAVs: () => {
    takeoffUAVs(selectedUAVIds);
  },

  turnMotorsOnForSelectedUAVs: () => {
    turnMotorOnForUAVs(selectedUAVIds);
  },
});
