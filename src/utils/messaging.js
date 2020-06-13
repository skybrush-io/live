/**
 * @file Utility file for sharing messaging related code between components.
 */

import countBy from 'lodash-es/countBy';
import isNil from 'lodash-es/isNil';
import values from 'lodash-es/values';

import messageHub from '~/message-hub';
import { showNotification } from '~/features/snackbar/slice';
import { MessageSemantics } from '~/features/snackbar/types';
import store from '~/store';

import makeLogger from './logging';

const logger = makeLogger('messaging');

const processResponse = (expectedType, commandName) => (response) => {
  if (!response) {
    logger.error(`${commandName} response should not be empty`);
  } else if (!response.body) {
    logger.error(`${commandName} response has no body`);
  } else if (response.body.type === 'ACK-NAK') {
    logger.error(
      `${commandName} execution rejected by server; ` +
        `reason: ${response.body.reason || 'unknown'}`
    );
  } else if (response.body.type !== expectedType) {
    logger.error(
      `${commandName} response has an unexpected type: ` +
        `${response.body.type}, expected ${expectedType}`
    );
  } else {
    const { body } = response;
    const { error } = body;

    if (error) {
      logger.error(
        `${commandName} execution failed for ${Object.keys(error).join(', ')}`
      );
    } else {
      logger.info(`${commandName} sent successfully`);
    }
  }
};

const processResponses = (commandName, responses) => {
  const responseCounts = countBy(values(responses));
  const numberOfSuccesses = responseCounts.true;
  const numberOfFailures = responseCounts.false;

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
  } else {
    semantics = MessageSemantics.SUCCESS;
    if (numberOfSuccesses > 1) {
      message = `${commandName} sent for ${numberOfSuccesses} UAVs`;
    } else if (numberOfSuccesses) {
      message = `${commandName} sent successfully`;
    }
  }

  store.dispatch(
    showNotification({
      message,
      semantics,
    })
  );
};

const performMassOperation = (type, name) => async (uavs) => {
  try {
    const responses = await messageHub.startAsyncOperation({
      type,
      ids: uavs,
    });
    processResponses(name, responses);
  } catch (error) {
    logger.error(`${name}: ${String(error)}`);
  }
};

export const takeoffUAVs = performMassOperation(
  'UAV-TAKEOFF',
  'Takeoff command'
);

export const landUAVs = performMassOperation('UAV-LAND', 'Landing command');

export const returnToHomeUAVs = performMassOperation(
  'UAV-RTH',
  'Return to home command'
);

export const shutdownUAVs = performMassOperation(
  'UAV-HALT',
  'Shutdown command'
);

export const resetUAVs = async (uavs, component) => {
  const request = {
    type: 'UAV-RST',
    ids: uavs,
  };

  if (component) {
    request.component = component;
  }

  const response = await messageHub.sendMessage(request);
  return processResponse('UAV-RST', 'Reset command')(response);
};

export const moveUAVs = (uavs, target) =>
  messageHub
    .sendMessage({
      type: 'UAV-FLY',
      ids: uavs,
      target: [
        Math.round(target.lat * 1e7),
        Math.round(target.lon * 1e7),
        isNil(target.amsl) ? null : Math.round(target.amsl * 1e3),
        isNil(target.agl) ? null : Math.round(target.agl * 1e3),
      ],
    })
    .then(processResponse('UAV-FLY', 'Fly to target command'));

export const createSelectionRelatedActions = (selectedUAVIds) => ({
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
    console.warn('Not implemented yet');
  },
});
