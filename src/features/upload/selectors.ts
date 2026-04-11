import { createSelector } from '@reduxjs/toolkit';
import isNil from 'lodash-es/isNil';
import mean from 'lodash-es/mean';

import { Status } from '~/components/semantics';
import { JOB_TYPE as FIRMWARE_UPDATE_JOB_TYPE } from '~/features/firmware-update/constants';
import { getSupportingObjectIdsForTargetId } from '~/features/firmware-update/selectors';
import { getMissionMapping as _getFullMissionMapping } from '~/features/mission/selectors';
import { getSelection } from '~/features/selection/selectors';
import { JOB_TYPE as SHOW_UPLOAD_JOB_TYPE } from '~/features/show/constants';
import {
  getUAVIdList as _getAllKnownUAVIds,
  getSingleSelectedUAVIdAsArray,
} from '~/features/uavs/selectors';
import { uavIdToGlobalId } from '~/model/identifiers';
import type { RootState } from '~/store/reducers';
import { rejectNullish } from '~/utils/arrays';
import type { Identifier } from '~/utils/collections';
import { formatMissionId } from '~/utils/formatting';
import { EMPTY_ARRAY } from '~/utils/redux';

import { getScopeForJobType, JobScope } from './jobs';
import type { UploadSliceState } from './slice';
import type {
  HistoryItem,
  JobPayload,
  UploadJobResult,
  UploadStatus,
} from './types';
import { aggregateUAVStatusesFromHistory } from './utils';

/**
 * Returns the current upload job. The returned object is guaranteed to have
 * two keys: <code>type</code> for the type of the job and <code>payload</code>
 * for its parameters. The type is <code>null</code> if no job has been set up
 * yet.
 */
export const getCurrentUploadJob = createSelector(
  (state: RootState) => state.upload.currentJob,
  ({ type, payload }) => ({ type: type ?? null, payload })
);

/**
 * Returns whether there is at least one queued item in the backlog.
 */
export const hasQueuedItems = (state: RootState): boolean =>
  getItemsInUploadBacklog(state).length > 0;

/**
 * Returns whether we are currently uploading data to the drones.
 */
export const isUploadInProgress = (state: RootState): boolean =>
  state.upload.currentJob.running;

/**
 * Returns the type of the current upload job _if and only if_ a job is running
 * now, or <code>undefined</code> if no job has been set up yet or no job is running.
 */
export const getRunningUploadJobType = createSelector(
  (state: RootState) => state.upload.currentJob,
  ({ type, running }) => (!isNil(type) && running ? type : undefined)
);

/**
 * Returns the selected job in the upload dialog.
 */
export const getSelectedJobInUploadDialog = (
  state: RootState
): { type?: string; payload?: JobPayload } =>
  getUploadDialogState(state)?.selectedJob ?? {};

/**
 * Returns the selected job type in the upload dialog.
 */
export const getSelectedJobTypeInUploadDialog = (
  state: RootState
): string | undefined => getSelectedJobInUploadDialog(state).type;

/**
 * Returns the history items for the given job type, or an empty array if there
 * is no history for it.
 */
const getHistoryForJobType = (
  history: Record<string, HistoryItem[]>,
  jobType: string | undefined
): HistoryItem[] => (jobType ? (history[jobType] ?? EMPTY_ARRAY) : EMPTY_ARRAY);

/**
 * Returns the history items for the currently selected job type, or an empty
 * array if no job type is selected or there is no history for it.
 */
const getHistoryForSelectedJobType = createSelector(
  (state: RootState) => state.upload.history,
  getSelectedJobTypeInUploadDialog,
  getHistoryForJobType
);

/**
 * Selector that returns the set of UAV IDs that may be relevant for the
 * current job type, assuming filtering is necessary in a selector or action.
 *
 * The selector returns `undefined` if no filtering is necessary.
 *
 * Upload job types that may require filtering:
 *
 * - `SHOW_UPLOAD_JOB_TYPE`: UAVs that don't participate in the mission don't
 *   matter for example in upload status counts, cumulative upload status,
 *   or enqueueing.
 */
const getFilteredUAVIdsForCurrentJobType = createSelector(
  getSelectedJobTypeInUploadDialog,
  _getFullMissionMapping,
  (jobType, missionMapping): Set<Identifier> | undefined => {
    return jobType === SHOW_UPLOAD_JOB_TYPE
      ? new Set(missionMapping.filter((uav): uav is Identifier => uav !== null))
      : undefined;
  }
);

/**
 * Returns a mapping of UAV IDs to their corresponding upload status codes,
 * based only on the current queue states.
 *
 * Status mapping is as follows:
 *
 * - Failed uploads --> Status.ERROR
 * - Upload in progress --> Status.WARNING
 * - Enqueued to a worker --> Status.NEXT
 * - Waiting to start --> Status.INFO
 * - Finished --> Status.SUCCESS
 */
const getUploadStatusCodeMappingOfQueuedUAVs = createSelector(
  (state: RootState) => state.upload.queues,
  (queues) => {
    const result: Record<Identifier, Status> = {};
    for (const uavId of queues.itemsWaitingToStart) {
      result[uavId] = Status.WAITING;
    }

    for (const uavId of queues.itemsQueued) {
      result[uavId] = Status.NEXT;
    }

    for (const uavId of queues.itemsInProgress) {
      result[uavId] = Status.WARNING;
    }

    for (const uavId of queues.itemsFinished) {
      result[uavId] = Status.SUCCESS;
    }

    for (const uavId of queues.failedItems) {
      result[uavId] = Status.ERROR;
    }
    return result;
  }
);

/**
 * Selector factory that creates a selector that returns the status code
 * mapping, combining the upload history and the current queues.
 *
 * If `jobType` is `undefined`, the dialog's selected job type will be used.
 */
export const makeUploadStatusCodeMappingForJobTypeSelector = (
  jobType?: string
) =>
  createSelector(
    (state: RootState) => state.upload.history,
    getUploadStatusCodeMappingOfQueuedUAVs,
    getSelectedJobTypeInUploadDialog,
    (history, queuedMapping, dialogJobType): Record<Identifier, Status> => {
      const historyItems = getHistoryForJobType(
        history,
        jobType ?? dialogJobType
      );

      // Aggregate from history
      const result: Record<Identifier, Status> =
        aggregateUAVStatusesFromHistory(historyItems, (status) =>
          status === 'error' ? Status.ERROR : Status.SUCCESS
        );

      // Add current queues on top
      Object.assign(result, queuedMapping);

      return result;
    }
  );

/**
 * Returns a mapping from UAV IDs to their corresponding upload status codes,
 * combining the upload history and the current queues.
 */
export const getUploadStatusCodeMappingForSelectedJobType =
  makeUploadStatusCodeMappingForJobTypeSelector();

/**
 * Returns all upload items whose last known status is error and who can
 * be added to the waiting queue for the current job type.
 */
export const getFailedUploadItemsToEnqueue = createSelector(
  getUploadStatusCodeMappingForSelectedJobType,
  getFilteredUAVIdsForCurrentJobType,
  (statusMapping, relevantIds): Identifier[] => {
    const result: Identifier[] = [];
    const includeUAV =
      relevantIds === undefined
        ? () => true
        : (uavId: Identifier) => relevantIds.has(uavId);

    for (const [uavId, status] of Object.entries(statusMapping)) {
      if (status === Status.ERROR && includeUAV(uavId)) {
        result.push(uavId);
      }
    }

    return result;
  }
);

/**
 * Returns all upload items whose last known status is success and who
 * can be added to the waiting queue for the current job type.
 */
export const getSuccessfulUploadItemsToEnqueue = createSelector(
  getUploadStatusCodeMappingForSelectedJobType,
  getFilteredUAVIdsForCurrentJobType,
  (statusMapping, relevantIds): Identifier[] => {
    const result: Identifier[] = [];
    const includeUAV =
      relevantIds === undefined
        ? () => true
        : (uavId: Identifier) => relevantIds.has(uavId);

    for (const [uavId, status] of Object.entries(statusMapping)) {
      if (status === Status.SUCCESS && includeUAV(uavId)) {
        result.push(uavId);
      }
    }

    return result;
  }
);

/**
 * Returns the result of the last job with the given types: success, error
 * or cancelled (as a string), or undefined if there was no job with the
 * given type yet. Also returns undefined if the job type is nullish.
 */
export const getLastUploadResultByJobType = (
  state: RootState,
  type: string
): UploadJobResult | undefined => {
  const items = getHistoryForJobType(state.upload.history, type);
  return items.length === 0 ? undefined : items[items.length - 1].result;
};

/**
 * Returns the upload items that are either already sent to a worker or that
 * are being processed by a worker. These items are the ones where the user
 * cannot intervene with the upload process.
 */
export const getUploadItemsBeingProcessed = createSelector(
  (state: RootState) => state.upload.queues.itemsQueued,
  (state: RootState) => state.upload.queues.itemsInProgress,
  (queued, waiting) => [...queued, ...waiting]
);

/**
 * Returns the upload items that are currently in the backlog of the uploader:
 * the ones that are waiting to be started and the ones that have been queued
 * inside the uploader saga but have not been taken up by a worker yet.
 */
export const getItemsInUploadBacklog = createSelector(
  (state: RootState) => state.upload.queues.itemsQueued,
  (state: RootState) => state.upload.queues.itemsWaitingToStart,
  (queued, waiting) => [...queued, ...waiting]
);

/**
 * Returns whether there is at least one item in the backlog of the uploader,
 * i.e. there is at least one item that is either waiting to be started or
 * that has been queued inside the uploader saga but has not been taken up
 * by a worker yet.
 */
export function areItemsInUploadBacklog(state: RootState): boolean {
  const { itemsQueued, itemsWaitingToStart } = state.upload.queues;
  return itemsQueued.length > 0 || itemsWaitingToStart.length > 0;
}

/**
 * Returns whether the UAV with the given ID is in the upload backlog at the
 * moment.
 */
export function isItemInUploadBacklog(
  state: RootState,
  uavId: string
): boolean {
  const { itemsQueued, itemsWaitingToStart } = state.upload.queues;
  return itemsWaitingToStart.includes(uavId) || itemsQueued.includes(uavId);
}

/**
 * Returns the ID of the next drone from the upload queue during an upload
 * process, or undefined if the queue is empty.
 */
export const getNextDroneFromUploadQueue = (
  state: RootState
): string | undefined => {
  const { itemsWaitingToStart } = state.upload.queues;
  if (itemsWaitingToStart && itemsWaitingToStart.length > 0) {
    return itemsWaitingToStart[0];
  }

  return undefined;
};

/**
 * Returns the state object of the upload dialog.
 */
export const getUploadDialogState = (
  state: RootState
): UploadSliceState['dialog'] => state.upload.dialog;

/**
 * Returns whether failed uploads should be retried automatically.
 */
export const shouldRetryFailedUploadsAutomatically = (
  state: RootState
): boolean => Boolean(state.upload.settings?.autoRetry);

/**
 * Returns whether the UAVs that failed the upload should be instructed to
 * flash their lights.
 */
export const shouldFlashLightsOfFailedUploads = (state: RootState): boolean =>
  Boolean(state.upload.settings?.flashFailed);

export const shouldRestrictToGlobalSelection = (state: RootState): boolean =>
  Boolean(state.upload.settings.restrictToGlobalSelection);

/**
 * Returns the scope of the currently _selected_ job in the upload dialog.
 */
export const getScopeOfSelectedJobInUploadDialog = createSelector(
  getSelectedJobTypeInUploadDialog,
  (jobType) => (jobType ? getScopeForJobType(jobType) : JobScope.ALL)
);

export const getMissionIdFormatter = createSelector(
  _getFullMissionMapping,
  (missionMapping) => {
    const idMap = missionMapping.reduce(
      (res, id, index) => {
        if (id === null) {
          return res;
        }

        res[id] = formatMissionId(index);
        return res;
      },
      {} as Record<string, string>
    );

    return (id: string): string => idMap[id] ?? 'N/A';
  }
);

export const getMissionMapping = createSelector(
  _getFullMissionMapping,
  getSelection,
  shouldRestrictToGlobalSelection,
  (missionMapping, selection, restrictToGlobalSelection) => {
    if (!restrictToGlobalSelection) {
      return missionMapping;
    }

    const allowedIds = new Set(selection);
    return missionMapping.filter(
      (id) => id !== null && allowedIds.has(uavIdToGlobalId(id))
    );
  }
);

/**
 * Factory that creates a selector that returns the upload status for
 * the given job type, taking all UAVs in the mission into account.
 */
export const makeUploadStatusSelectorForMissionMappingByJobType = (
  jobType: string
) =>
  createSelector(
    (state: RootState) => getHistoryForJobType(state.upload.history, jobType),
    _getFullMissionMapping,
    (historyItems, missionMapping): UploadStatus => {
      // We ignore the currently executed upload and only work from the
      // history for efficiency.
      const uavsInMission = missionMapping.filter((id) => id !== null);
      if (historyItems.length === 0 || uavsInMission.length === 0) {
        return 'not-available';
      }

      const uploadStatuses = aggregateUAVStatusesFromHistory(
        historyItems,
        (status) => status
      );

      let hasMissingUav = false;
      for (const item of uavsInMission) {
        const status = uploadStatuses[item];
        switch (status) {
          case 'error':
            return 'error';
          case 'success':
            break;
          default:
            hasMissingUav = true;
            break;
        }
      }

      return hasMissingUav ? 'partial' : 'success';
    }
  );

export const getObjectIdsCompatibleWithSelectedJobInUploadDialog = (
  state: RootState
): string[] => {
  const job = getSelectedJobInUploadDialog(state);
  const selection = getSelection(state);
  const restrictToGlobalSelection = shouldRestrictToGlobalSelection(state);

  let result: string[];

  switch (job.type) {
    case FIRMWARE_UPDATE_JOB_TYPE: {
      result =
        getSupportingObjectIdsForTargetId(
          state,
          (job.payload as any as { target: string }).target
        ) ?? [];

      break;
    }

    default:
      return [];
  }

  if (restrictToGlobalSelection) {
    const allowedIds = new Set(selection);
    result = result.filter((id) => allowedIds.has(uavIdToGlobalId(id)));
  }

  return result;
};

/**
 * Returns an object mapping UAV IDs to the corresponding error messages that
 * should be shown next to them (or as a tooltip) in the upload dialog.
 */
export const getUploadErrorMessageMapping = createSelector(
  getHistoryForSelectedJobType,
  (state: RootState) => state.upload.errors,
  (historyItems, errors): Record<Identifier, string> => {
    const result: Record<Identifier, string> = {};

    // Aggregate from history
    for (const item of historyItems) {
      for (const [uavId, error] of Object.entries(item.perUavErrors)) {
        result[uavId] = error;
      }
    }

    // Add active errors on top
    for (const [uavId, error] of Object.entries(errors)) {
      result[uavId] = error;
    }

    return result;
  }
);

/**
 * Returns an object whose keys are the UAV IDs that participated in the
 * latest upload for the selected job type.
 *
 * If an upload is in progress, then only UAVs in one of the queues
 * are included in the result. Otherwise the result is calculated
 * from the last history item and the current queues.
 */
export const getUAVsInLatestUploadForSelectedJobType = createSelector(
  getHistoryForSelectedJobType,
  getUploadStatusCodeMappingOfQueuedUAVs,
  isUploadInProgress,
  (historyItems, queuedStatuses, inProgress): Record<Identifier, unknown> => {
    if (inProgress) {
      return queuedStatuses;
    }

    const result: Record<Identifier, unknown> = { ...queuedStatuses };
    if (historyItems.length > 0) {
      Object.assign(
        result,
        historyItems[historyItems.length - 1].perUavStatuses
      );
    }

    return result;
  }
);

/**
 * Returns an object that counts how many drones are currently in the
 * "waiting", "in progress", "failed" and "successful" stages of the upload.
 */
export const getUploadStatusCodeCounters = createSelector(
  getUploadStatusCodeMappingForSelectedJobType,
  getFilteredUAVIdsForCurrentJobType,
  (statusMapping, relevantIds) => {
    const counts = { failed: 0, finished: 0, inProgress: 0, waiting: 0 };
    // Function that returns 1 if the given UAV should be counted, 0 otherwise.
    const countUAV =
      relevantIds === undefined
        ? () => 1
        : (uav: Identifier) => (relevantIds.has(uav) ? 1 : 0);

    for (const [uavId, status] of Object.entries(statusMapping)) {
      switch (status) {
        case Status.ERROR:
          counts.failed += countUAV(uavId);
          break;
        case Status.SUCCESS:
          counts.finished += countUAV(uavId);
          break;
        case Status.WARNING:
          // Count all in-progress UAVs
          counts.inProgress++;
          break;
        case Status.WAITING:
        case Status.NEXT:
          // Count all queued UAVs
          counts.waiting++;
          break;
      }
    }

    return counts;
  }
);

export const getAverageProgressOfItemsInProgress = createSelector(
  (state: RootState) => state.upload.queues.itemsInProgress,
  (state: RootState) => state.upload.progresses,
  (itemsInProgress, progresses) =>
    itemsInProgress.length > 0
      ? mean(itemsInProgress.map((id) => progresses[id] ?? 0))
      : 0
);

/**
 * Returns a summary of the progress of the upload process in the form of
 * two numbers. The first is a percentage of items for which the upload has
 * either finished successfully or has failed. The second is a percentage of
 * items for which the upload has finished successfully, is in progress or
 * has failed.
 */
export const getUploadProgress = createSelector(
  getUploadStatusCodeCounters,
  getAverageProgressOfItemsInProgress,
  ({ failed, finished, inProgress, waiting }, averageProgress) => {
    const total = failed + finished + inProgress + waiting;
    if (total > 0) {
      return [
        Math.round((100 * (finished + inProgress * averageProgress)) / total),
        Math.round((100 * (finished + inProgress)) / total),
      ];
    } else {
      return [0, 0];
    }
  }
);

export const getUAVIdList = createSelector(
  _getAllKnownUAVIds,
  getSelection,
  shouldRestrictToGlobalSelection,
  (allUAVIds, selection, restrictToGlobalSelection) => {
    if (!restrictToGlobalSelection) {
      return allUAVIds;
    }

    const allowedIds = new Set(selection);
    return allUAVIds.filter((id) => allowedIds.has(uavIdToGlobalId(id)));
  }
);

/**
 * Returns a list of all the UAV IDs that participate in the mission and for
 * which the upload job can be executed.
 *
 * Null entries are ignored.
 *
 * The result is sorted in ascending order by mission indices, and not by show
 * IDs! In other words, UAV IDs that correspond to earlier slots in the mission
 * mapping are returned first.
 *
 * Note that this also includes the IDs of UAVs that are currently not seen
 * by the server but are nevertheless in the mapping.
 */
const getMissionUAVIdsForUploadJob = createSelector(
  getMissionMapping,
  (mapping) => rejectNullish(mapping)
);

/**
 * Returns the list of UAV IDs that should be shown in the upload dialog.
 */
export const getUploadDialogIdList = createSelector(
  (state: RootState) => state,
  getScopeOfSelectedJobInUploadDialog,
  (state, scope): string[] => {
    let selector;

    switch (scope) {
      case JobScope.ALL:
        selector = getUAVIdList;
        break;

      case JobScope.COMPATIBLE:
        selector = getObjectIdsCompatibleWithSelectedJobInUploadDialog;
        break;

      case JobScope.MISSION:
        selector = getMissionUAVIdsForUploadJob;
        break;

      case JobScope.SINGLE:
        selector = getSingleSelectedUAVIdAsArray;
        break;

      default:
        selector = getUAVIdList;
        break;
    }

    const result = selector(state);

    return result;
  }
);

/**
 * Returns the list of UAV IDs for which the upload job should be executed.
 *
 * UAVs that are not in the global selection may be ignored, depending on
 * the upload dialog's state.
 */
export const getUploadTargets = createSelector(
  areItemsInUploadBacklog,
  getItemsInUploadBacklog,
  getUploadDialogIdList,
  (hasBacklog, backlog, dialogIds) => (hasBacklog ? backlog : dialogIds)
);

/**
 * Returns whether there are upload targets that may not be visible to
 * the user.
 */
export const hasHiddenTargets = createSelector(
  getUploadTargets,
  getUploadDialogIdList,
  (targets, visibleArray): boolean => {
    if (targets === null) {
      return false;
    }

    const visible = new Set(visibleArray);
    return targets.some((id) => !visible.has(id));
  }
);

/**
 * Returns the estimated completion time of the current upload job, or
 * undefined if no such time can be estimated.
 */
export const getEstimatedCompletionTime = (state: RootState) =>
  state.upload.timing?.estimatedEndAt;
