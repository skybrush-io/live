/**
 * @file Functions and data structures related to the handling of the various
 * stages that one needs to pass through in order to launch a drone show.
 */

import isEmpty from 'lodash-es/isEmpty';

import { JOB_TYPE } from './constants';
import {
  areManualPreflightChecksSignedOff,
  areOnboardPreflightChecksSignedOff,
  areStartConditionsSyncedWithServer,
  didLastLoadingAttemptFail,
  didStartConditionSyncFail,
  hasLoadedShowFile,
  hasScheduledStartTime,
  hasShowChangedExternallySinceLoaded,
  hasShowOrigin,
  isLoadingShowFile,
  isShowAuthorizedToStart,
  isShowAuthorizedToStartLocally,
  isShowConvexHullInsideGeofence,
  isShowIndoor,
  isShowOutdoor,
  isTakeoffAreaApproved,
} from './selectors';

import { Status } from '~/components/semantics';

import {
  getEmptyMappingSlotIndices,
  getGeofenceStatus,
  hasActiveGeofencePolygon,
  hasNonemptyMappingSlot,
} from '~/features/mission/selectors';
import {
  areAllPreflightChecksTicked,
  hasManualPreflightChecks,
} from '~/features/preflight/selectors';
import { isConnected as isConnectedToServer } from '~/features/servers/selectors';
import {
  areAllUAVsInMissionWithoutErrors,
  getMissingUAVIdsInMapping,
} from '~/features/uavs/selectors';
import { getLastUploadResultByJobType } from '~/features/upload/selectors';

/**
 * Definitions of the stages that one needs to pass through in order to launch
 * a drone show.
 */
const stages = {
  selectShowFile: {
    evaluate: (state) =>
      hasShowChangedExternallySinceLoaded(state)
        ? Status.SKIPPED
        : didLastLoadingAttemptFail(state)
        ? Status.ERROR
        : hasLoadedShowFile(state)
        ? Status.SUCCESS
        : isLoadingShowFile(state)
        ? Status.WAITING
        : Status.OFF,
  },

  setupEnvironment: {
    evaluate: (state) =>
      hasLoadedShowFile(state) && (hasShowOrigin(state) || isShowIndoor(state)),
    requires: ['selectShowFile'],
  },

  setupTakeoffArea: {
    evaluate: (state) =>
      isTakeoffAreaApproved(state)
        ? isEmpty(getEmptyMappingSlotIndices(state)) &&
          isEmpty(getMissingUAVIdsInMapping(state))
          ? Status.SUCCESS
          : Status.SKIPPED
        : Status.OFF,
    requires: ['setupEnvironment'],
  },

  setupGeofence: {
    evaluate: (state) =>
      isShowOutdoor(state) && hasActiveGeofencePolygon(state)
        ? isShowConvexHullInsideGeofence(state)
          ? getGeofenceStatus(state)
          : Status.ERROR
        : Status.OFF,
    requires: ['selectShowFile', 'setupEnvironment'],
  },

  uploadShow: {
    evaluate(state) {
      const result = getLastUploadResultByJobType(state, JOB_TYPE);
      return result === 'error'
        ? Status.ERROR
        : result === 'cancelled'
        ? Status.SKIPPED
        : result === 'success'
        ? Status.SUCCESS
        : Status.OFF;
    },
    requires: ['selectShowFile', 'setupEnvironment', hasNonemptyMappingSlot],
  },

  waitForOnboardPreflightChecks: {
    evaluate: (state) =>
      areOnboardPreflightChecksSignedOff(state)
        ? areAllUAVsInMissionWithoutErrors(state)
          ? Status.SUCCESS
          : Status.SKIPPED
        : Status.OFF,
    requires: ['uploadShow'],
  },

  performManualPreflightChecks: {
    evaluate: (state) =>
      areManualPreflightChecksSignedOff(state) ||
      !hasManualPreflightChecks(state)
        ? areAllPreflightChecksTicked(state)
          ? Status.SUCCESS
          : Status.SKIPPED
        : Status.OFF,
    requires: ['uploadShow'],
  },

  setupStartTime: {
    evaluate: (state) =>
      didStartConditionSyncFail(state)
        ? Status.ERROR
        : areStartConditionsSyncedWithServer(state)
        ? hasScheduledStartTime(state)
          ? Status.SUCCESS
          : Status.OFF
        : isConnectedToServer(state)
        ? Status.WAITING
        : Status.OFF,
    requires: ['selectShowFile'],
    suggests: ['waitForOnboardPreflightChecks', 'performManualPreflightChecks'],
  },

  authorization: {
    evaluate: (state) =>
      isShowAuthorizedToStart(state)
        ? Status.SUCCESS
        : didStartConditionSyncFail(state)
        ? Status.ERROR
        : isShowAuthorizedToStartLocally(state)
        ? Status.WAITING
        : Status.OFF,
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
  'setupGeofence',
  'uploadShow',
  'waitForOnboardPreflightChecks',
  'performManualPreflightChecks',
  'setupStartTime',
  'authorization',
];

/**
 * Returns whether the status code is treated as "done" from the point of view
 * of inspecting dependencies between stages.
 */
const isDone = (status) =>
  status === Status.SUCCESS || status === Status.SKIPPED;

/**
 * Returns whether all dependencies in the given list are considered "done"
 */
const allDone = (result, deps, state) =>
  (deps || []).every((dep) =>
    typeof dep === 'function' ? dep(state) : isDone(result[dep])
  );

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

    if (allDone(result, stage.requires, state)) {
      // all dependencies are satisfied, so we can check its own state
      status = stage.evaluate(state);

      // convert booleans to Status
      if (typeof status === 'boolean') {
        status = status ? Status.SUCCESS : Status.OFF;
      }

      if (status === Status.OFF) {
        // state has not been acted on by the user, but all its dependencies are
        // ready so we mark it as a potential candidate for the user to perform
        // next if all its 'suggests' dependencies are ready
        status = allDone(result, stage.suggests, state)
          ? Status.NEXT
          : Status.OFF;
      }
    } else {
      status = Status.OFF;
    }

    result[stageId] = status;
  }

  return result;
};
