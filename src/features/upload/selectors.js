/* eslint unicorn/no-array-callback-reference: 0 */

import isNil from 'lodash-es/isNil';
import { createSelector } from '@reduxjs/toolkit';

import { Status } from '~/components/semantics';
import { getScopeForJobType, JobScope } from './jobs';

/**
 * Returns the current upload job. The returned object is guaranteed to have
 * two keys: <code>type</code> for the type of the job and <code>payload</code>
 * for its parameters. The type is <code>null</code> if no job has been set up
 * yet.
 */
export const getCurrentUploadJob = createSelector(
  (state) => state.upload.currentJob,
  ({ type, payload }) => ({ type: type || null, payload })
);

/**
 * Returns the type of the current upload job _if and only if_ a job is running
 * now, or <code>null</code> if no job has been set up yet or no job is running.
 */
export const getRunningUploadJobType = createSelector(
  (state) => state.upload.currentJob,
  ({ type, running }) => (!isNil(type) && running ? type : null)
);

/**
 * Returns the failed upload items from the uploader.
 */
export const getFailedUploadItems = (state) => state.upload.queues.failedItems;

/**
 * Returns the result of the last job with the given types: success, error or cancelled
 * (as a string), or null if there was no job with the given type yet. Also
 * returns null if the job type is null.
 */
export const getLastUploadResultByJobType = (state, type) =>
  type ? state.upload.history.byId[type]?.result : null;

/**
 * Returns the upload items that are either already sent to a worker or that
 * are being processed by a worker. These items are the ones where the user
 * cannot intervene with the upload process.
 */
export const getUploadItemsBeingProcessed = createSelector(
  (state) => state.upload.queues.itemsQueued,
  (state) => state.upload.queues.itemsInProgress,
  (queued, waiting) => [...queued, ...waiting]
);

/**
 * Returns the upload items that are currently in the backlog of the uploader:
 * the ones that are waiting to be started and the ones that have been queued
 * inside the uploader saga but have not been taken up by a worker yet.
 */
export const getItemsInUploadBacklog = createSelector(
  (state) => state.upload.queues.itemsQueued,
  (state) => state.upload.queues.itemsWaitingToStart,
  (queued, waiting) => [...queued, ...waiting]
);

/**
 * Returns the successful upload items from the uploader.
 */
export const getSuccessfulUploadItems = (state) =>
  state.upload.queues.itemsFinished;

/**
 * Returns whether there is at least one item in the backlog of the uploader,
 * i.e. there is at least one item that is either waiting to be started or
 * that has been queued inside the uploader saga but has not been taken up
 * by a worker yet.
 */
export function areItemsInUploadBacklog(state) {
  const { itemsQueued, itemsWaitingToStart } = state.upload.queues;
  return itemsQueued.length > 0 || itemsWaitingToStart.length > 0;
}

/**
 * Returns whether the UAV with the given ID is in the upload backlog at the
 * moment.
 */
export function isItemInUploadBacklog(state, uavId) {
  const { itemsQueued, itemsWaitingToStart } = state.upload.queues;
  return itemsWaitingToStart.includes(uavId) || itemsQueued.includes(uavId);
}

/**
 * Returns the ID of the next drone from the upload queue during an upload
 * process, or undefined if the queue is empty.
 */
export const getNextDroneFromUploadQueue = (state) => {
  const { itemsWaitingToStart } = state.upload.queues;
  if (itemsWaitingToStart && itemsWaitingToStart.length > 0) {
    return itemsWaitingToStart[0];
  }

  return undefined;
};

/**
 * Returns the state object of the upload dialog.
 */
export const getUploadDialogState = (state) => state.upload.dialog;

/**
 * Returns the selected job in the upload dialog.
 */
export const getSelectedJobInUploadDialog = (state) =>
  getUploadDialogState(state)?.selectedJob ?? {};

/**
 * Returns whether the currently _selected_ upload job in the upload dialog
 * is scoped to the UAVs in the current mission.
 */
export const isSelectedJobInUploadDialogScopedToMission = createSelector(
  getSelectedJobInUploadDialog,
  ({ type }) => getScopeForJobType(type) === JobScope.MISSION
);

/**
 * Returns an object mapping UAV IDs to the corresponding error messages that
 * should be shown next to them (or as a tooltip) in the upload dialog.
 */
export const getUploadErrorMessageMapping = (state) => state.upload.errors;

/**
 * Returns an object that counts how many drones are currently in the
 * "waiting", "in progress", "failed" and "successful" stages of the upload.
 */
export const getUploadStatusCodeCounters = createSelector(
  (state) => state.upload.queues,
  ({
    failedItems,
    itemsFinished,
    itemsInProgress,
    itemsQueued,
    itemsWaitingToStart,
  }) => ({
    failed: Array.isArray(failedItems) ? failedItems.length : 0,
    finished: Array.isArray(itemsFinished) ? itemsFinished.length : 0,
    inProgress: Array.isArray(itemsInProgress) ? itemsInProgress.length : 0,
    waiting:
      (Array.isArray(itemsQueued) ? itemsQueued.length : 0) +
      (Array.isArray(itemsWaitingToStart) ? itemsWaitingToStart.length : 0),
  })
);

/**
 * Returns a mapping from UAV IDs to their corresponding upload status codes
 * according to the following encoding:
 *
 * - Failed uploads --> Status.ERROR
 * - Upload in progress --> Status.WARNING
 * - Enqueued to a worker --> Status.NEXT
 * - Waiting to start --> Status.INFO
 * - Finished --> Status.SUCCESS
 *
 * UAV IDs not found in the returned mapping are not participating in the
 * current upload; they should be treated as Status.OFF
 */
export const getUploadStatusCodeMapping = createSelector(
  (state) => state.upload.queues,
  ({
    failedItems,
    itemsFinished,
    itemsInProgress,
    itemsQueued,
    itemsWaitingToStart,
  }) => {
    const result = {};

    for (const uavId of itemsWaitingToStart) {
      result[uavId] = Status.WAITING;
    }

    for (const uavId of itemsQueued) {
      result[uavId] = Status.NEXT;
    }

    for (const uavId of itemsInProgress) {
      result[uavId] = Status.WARNING;
    }

    for (const uavId of itemsFinished) {
      result[uavId] = Status.SUCCESS;
    }

    for (const uavId of failedItems) {
      result[uavId] = Status.ERROR;
    }

    return result;
  }
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
  ({ failed, finished, inProgress, waiting }) => {
    const total = failed + finished + inProgress + waiting;
    if (total > 0) {
      return [
        Math.round((100 * finished) / total),
        Math.round((100 * (finished + inProgress)) / total),
      ];
    } else {
      return [0, 0];
    }
  }
);

/**
 * Returns whether there is at least one queued item in the backlog.
 */
export const hasQueuedItems = (state) =>
  getItemsInUploadBacklog(state).length > 0;

/**
 * Returns whether we are currently uploading show data to the drones.
 */
export const isUploadInProgress = (state) => state.upload.currentJob.running;

/**
 * Returns whether failed uploads should be retried automatically.
 */
export const shouldRetryFailedUploadsAutomatically = (state) =>
  Boolean(state.upload.settings?.autoRetry);

/**
 * Returns whether the UAVs that failed the upload should be instructed to
 * flash their lights.
 */
export const shouldFlashLightsOfFailedUploads = (state) =>
  Boolean(state.upload.settings?.flashFailed);
