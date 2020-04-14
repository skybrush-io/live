/**
 * @file Functions and data structures related to the handling of the various
 * stages that one needs to pass through in order to launch a drone show.
 */

import isEmpty from 'lodash-es/isEmpty';

import {
  areManualPreflightChecksSignedOff,
  areOnboardPreflightChecksSignedOff,
  areStartConditionsSyncedWithServer,
  didStartConditionSyncFail,
  hasLoadedShowFile,
  hasScheduledStartTime,
  hasShowOrigin,
  isLoadingShowFile,
  isShowAuthorizedToStart,
  isShowAuthorizedToStartLocally,
  isTakeoffAreaApproved,
} from './selectors';

import { getEmptyMappingSlotIndices } from '~/features/mission/selectors';
import { areAllPreflightChecksTicked } from '~/features/preflight/selectors';
import {
  areAllUAVsInMissionWithoutErrors,
  getMissingUAVIdsInMapping,
} from '~/features/uavs/selectors';

import { StepperStatus } from '~/components/StepperStatusLight';

/**
 * Definitions of the stages that one needs to pass through in order to launch
 * a drone show.
 */
const stages = {
  selectShowFile: {
    evaluate: (state) =>
      hasLoadedShowFile(state)
        ? StepperStatus.COMPLETED
        : isLoadingShowFile(state)
        ? StepperStatus.WAITING
        : StepperStatus.OFF,
  },

  setupEnvironment: {
    evaluate: (state) => hasLoadedShowFile(state) && hasShowOrigin(state),
    requires: ['selectShowFile'],
  },

  setupTakeoffArea: {
    evaluate: (state) =>
      isTakeoffAreaApproved(state)
        ? isEmpty(getEmptyMappingSlotIndices(state)) &&
          isEmpty(getMissingUAVIdsInMapping(state))
          ? StepperStatus.COMPLETED
          : StepperStatus.SKIPPED
        : StepperStatus.OFF,
    requires: ['setupEnvironment'],
  },

  uploadShow: {
    evaluate: () => false,
    requires: ['selectShowFile', 'setupEnvironment'],
  },

  setupStartTime: {
    evaluate: (state) =>
      didStartConditionSyncFail(state)
        ? StepperStatus.ERROR
        : areStartConditionsSyncedWithServer(state)
        ? hasScheduledStartTime(state)
          ? StepperStatus.COMPLETED
          : StepperStatus.OFF
        : StepperStatus.WAITING,
    requires: ['selectShowFile'],
  },

  waitForOnboardPreflightChecks: {
    evaluate: (state) =>
      areOnboardPreflightChecksSignedOff(state)
        ? areAllUAVsInMissionWithoutErrors(state)
          ? StepperStatus.COMPLETED
          : StepperStatus.SKIPPED
        : StepperStatus.OFF,
    suggests: ['setupStartTime'],
  },

  performManualPreflightChecks: {
    evaluate: (state) =>
      areManualPreflightChecksSignedOff(state)
        ? areAllPreflightChecksTicked(state)
          ? StepperStatus.COMPLETED
          : StepperStatus.SKIPPED
        : StepperStatus.OFF,
    suggests: ['setupStartTime'],
  },

  authorization: {
    evaluate: (state) =>
      isShowAuthorizedToStart(state)
        ? StepperStatus.COMPLETED
        : didStartConditionSyncFail(state)
        ? StepperStatus.ERROR
        : isShowAuthorizedToStartLocally(state)
        ? StepperStatus.WAITING
        : StepperStatus.OFF,
    requires: ['waitForOnboardPreflightChecks', 'performManualPreflightChecks'],
  },
};

/**
 * Topological sort of the stages such that it holds for each stage that it
 * has a higher index in this array than any of the stages it depends on.
 */
const stageOrder = [
  'selectShowFile',
  'setupEnvironment',
  'setupTakeoffArea',
  'setupStartTime',
  'uploadShow',
  'waitForOnboardPreflightChecks',
  'performManualPreflightChecks',
  'authorization',
];

/**
 * Returns whether the status code is treated as "done" from the point of view
 * of inspecting dependencies between stages.
 */
const isDone = (status) =>
  status === StepperStatus.COMPLETED || status === StepperStatus.SKIPPED;

/**
 * Returns whether all dependencies in the given list are considered "done"
 */
const allDone = (result, deps) =>
  (deps || []).every((dep) => isDone(result[dep]));

/**
 * Returns an object mapping the name of each stage in the show setup process
 * to a status constant, marking the next suggested stage that the user should
 * execute with 'next'.
 */
export const getSetupStageStatuses = (state) => {
  const result = {};

  for (const stageId of stageOrder) {
    const stage = stages[stageId];
    let status;

    if (allDone(result, stage.requires)) {
      // all dependencies are satisfied, so we can check its own state
      status = stage.evaluate(state);

      // convert booleans to StepperStatus
      if (typeof status === 'boolean') {
        status = status ? StepperStatus.COMPLETED : StepperStatus.OFF;
      }

      if (status === StepperStatus.OFF) {
        // state has not been acted on by the user, but all its dependencies are
        // ready so we mark it as a potential candidate for the user to perform
        // next if all its 'suggests' dependencies are read
        status = allDone(result, stage.suggests)
          ? StepperStatus.NEXT
          : StepperStatus.OFF;
      }
    } else {
      status = StepperStatus.OFF;
    }

    result[stageId] = status;
  }

  return result;
};
