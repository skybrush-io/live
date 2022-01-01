/* eslint unicorn/no-array-callback-reference: 0 */

import { createSelector } from '@reduxjs/toolkit';

import { Status } from '~/components/semantics';

/**
 * Returns the failed upload items from the uploader.
 */
export const getFailedUploadItems = (state) => state.upload.failedItems;

/**
 * Returns the result of the last upload attempt: success, error or cancelled
 * (as a string).
 */
export const getLastUploadResult = (state) => state.upload.lastUploadResult;

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
export const isUploadInProgress = (state) => state.upload.running;

/**
 * Returns whether failed uploads should be retried automatically.
 */
export const shouldRetryFailedUploadsAutomatically = (state) =>
  state.upload.autoRetry;
