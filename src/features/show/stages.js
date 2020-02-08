/**
 * @file Functions and data structures related to the handling of the various
 * stages that one needs to pass through in order to launch a drone show.
 */

import {
  areManualPreflightChecksSignedOff,
  areOnboardPreflightChecksSignedOff,
  hasLoadedShowFile,
  hasShowOrigin,
  isLoadingShowFile
} from './selectors';
import { StepperStatus } from '~/components/StepperStatusLight';

/**
 * Definitions of the stages that one needs to pass through in order to launch
 * a drone show.
 */
const stages = {
  selectShowFile: {
    evaluate: state =>
      hasLoadedShowFile(state)
        ? StepperStatus.completed
        : isLoadingShowFile(state)
        ? StepperStatus.waiting
        : StepperStatus.off
  },

  setupEnvironment: {
    evaluate: state => hasLoadedShowFile(state) && hasShowOrigin(state),
    requires: ['selectShowFile']
  },

  setupTakeoffArea: {
    evaluate: () => false,
    requires: ['setupEnvironment']
  },

  setupStartTime: {
    evaluate: () => false,
    requires: ['selectShowFile']
  },

  uploadShow: {
    evaluate: () => false,
    requires: ['selectShowFile', 'setupEnvironment']
  },

  waitForOnboardPreflightChecks: {
    // TODO(ntamas): return a warning only if there is at least one drone with
    // a non-zero error code
    evaluate: areOnboardPreflightChecksSignedOff,
    requires: ['uploadShow']
  },

  performManualPreflightChecks: {
    // TODO(ntamas): return a warning only if there is at least one preflight
    // check that the user has not ticked off explicitly
    evaluate: areManualPreflightChecksSignedOff,
    requires: ['uploadShow']
  }
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
  'performManualPreflightChecks'
];

/**
 * Returns an object mapping the name of each stage in the show setup process
 * to a status constant, marking the next suggested stage that the user should
 * execute with 'next'.
 */
export const getSetupStageStatuses = state => {
  const result = {};

  for (const stageId of stageOrder) {
    const stage = stages[stageId];
    let status;

    for (const requirementId of stage.requires || []) {
      if (
        result[requirementId] !== StepperStatus.completed &&
        result[requirementId] !== StepperStatus.skipped
      ) {
        // not all dependencies are satisfied for this task so we mark it as 'off'
        status = StepperStatus.off;
        break;
      }
    }

    if (!status) {
      // all dependencies are satisfied, so we can check its own state
      status = stage.evaluate(state);

      // convert booleans to StepperStatus
      if (typeof status === 'boolean') {
        status = status ? StepperStatus.completed : StepperStatus.off;
      }

      if (status === StepperStatus.off) {
        // state has not been acted on by the user, but all its dependencies are
        // ready so we mark it as a potential candidate for the user to perform
        // next
        status = StepperStatus.next;
      }
    }

    result[stageId] = status;
  }

  return result;
};
