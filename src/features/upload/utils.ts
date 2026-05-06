import {
  type CaseReducer,
  type Draft,
  type PayloadAction,
} from '@reduxjs/toolkit';
import isNil from 'lodash-es/isNil';
import pull from 'lodash-es/pull';
import without from 'lodash-es/without';

import type { Identifier } from '~/utils/collections';
import { EMPTY_ARRAY } from '~/utils/redux';

import { type UploadSliceState } from './slice';
import type { HistoryItem, UAVStatus, UploadJobResult } from './types';

const ALL_QUEUES: Array<keyof UploadSliceState['queues']> = [
  'failedItems',
  'itemsInProgress',
  'itemsWaitingToStart',
  'itemsQueued',
  'itemsFinished',
];

export function clearUploadHistoryForJobTypeHelper(
  state: Draft<UploadSliceState>,
  jobType: string
): void {
  delete state.history[jobType];
}

export function clearQueues(
  state: Draft<UploadSliceState>,
  options: { showLastUploadResult: boolean }
): void {
  state.queues = {
    itemsInProgress: [],
    itemsWaitingToStart: [],
    itemsQueued: [],
    itemsFinished: [],
    failedItems: [],
  };

  state.errors = {};
  state.progresses = {};

  state.dialog.showLastUploadResult = options.showLastUploadResult;
}

/**
 * Helper function to remove the stored error messages for all the UAVs in the
 * given array.
 */
function removeErrorsForUAVs(
  state: Draft<UploadSliceState>,
  uavIds: Identifier[]
): void {
  for (const uavId of uavIds) {
    delete state.errors[uavId];
  }
}

/**
 * Helper factory that returns a reducer function that ensures that one or more
 * upload items are to be found in one of the allowed upload status queues.
 *
 * It is assumed that the payload of the action will be the ID of the UAV that
 * is to be moved between queues, or an array of such IDs.
 *
 * @param options
 * @param options.target - Name of the target array that the items should be in
 *                         after calling this function. May be undefined to
 *                         remove the items from all queues except the ones
 *                         specified in 'doNotMoveWhenIn'.
 * @param options.doNotMoveWhenIn - Name of an additional queue or more
 *                                  additional queues that the items are allowed
 *                                  to remain in if they are already there
 */
export const ensureItemsInQueue = ({
  target,
  doNotMoveWhenIn = [],
}: {
  target?: keyof UploadSliceState['queues'];
  doNotMoveWhenIn?: Array<keyof UploadSliceState['queues']>;
} = {}): CaseReducer<
  UploadSliceState,
  PayloadAction<Identifier | Identifier[]>
> => {
  const allOtherQueues = without(
    ALL_QUEUES,
    ...(target ? [target] : []),
    ...doNotMoveWhenIn
  );

  return (state, action) => {
    const uavIds = Array.isArray(action.payload)
      ? action.payload
      : [action.payload];
    const targetQueue = target ? state.queues[target] : undefined;

    for (const queueName of allOtherQueues) {
      const queue = state.queues[queueName];
      pull(queue, ...uavIds);

      if (queueName === 'failedItems') {
        removeErrorsForUAVs(state, uavIds);
      }
    }

    if (!isNil(targetQueue)) {
      for (const uavId of uavIds) {
        if (!targetQueue.includes(uavId)) {
          targetQueue.push(uavId);
        }
      }
    }
  };
};

/**
 * Helper factory that returns a reducer function that moves one or more upload
 * items from a given upload status queue to another one.
 *
 * It is assumed that the payload of the action will be the ID of the UAV that
 * is to be moved between queues, or an array of such IDs.
 *
 * @param options
 * @param options.source - Name of the source array (queue) in `state.queues`
 *                         to remove the item from. The action becomes a no-op
 *                         for a particular item if it is not in the specified
 *                         source queue.
 * @param options.target - Name of the target array (queue) in `state.queues`
 *                         to add the item to; `undefined` means not to add the
 *                         item to a new queue
 */
export const moveItemsBetweenQueues =
  ({
    source,
    target,
  }: {
    source: keyof UploadSliceState['queues'];
    target?: keyof UploadSliceState['queues'];
  }): CaseReducer<UploadSliceState, PayloadAction<Identifier | Identifier[]>> =>
  (state, action) => {
    const uavIds = Array.isArray(action.payload)
      ? action.payload
      : [action.payload];
    const sourceQueue = state.queues[source];
    const targetQueue = target ? state.queues[target] : undefined;

    for (const uavId of uavIds) {
      const index = sourceQueue.indexOf(uavId);
      if (index >= 0) {
        sourceQueue.splice(index, 1);
      }
      // Add the item to the target queue even if it's not in the source queue
      if (targetQueue) {
        targetQueue.push(uavId);
      }
    }

    if (source === 'failedItems') {
      removeErrorsForUAVs(state, uavIds);
    }

    if (target === 'itemsFinished') {
      // UAVs that have finished uploading need their progress info to be set
      // to 100% so we can estimate the completion time of the tasks
      // accurately
      for (const uavId of uavIds) {
        state.progresses[uavId] = 1;
      }
    } else if (source === 'itemsInProgress') {
      // UAVs that are being moved from the "in progress" queue to anywhere
      // else such that they are not completed must have their progress info
      // reset
      for (const uavId of uavIds) {
        delete state.progresses[uavId];
      }
    }
  };

/**
 * Aggregates up to date UAV statuses from the given history items.
 *
 * Outdated statuses are ignored.
 */
export function aggregateUAVStatusesFromHistory<TStatus>(
  historyItems: HistoryItem[] | undefined,
  mapStatus: (status: UAVStatus) => TStatus
): Record<Identifier, TStatus> {
  const result: Record<Identifier, TStatus> = {};
  if (historyItems === undefined) {
    return result;
  }

  for (const item of historyItems) {
    for (const [uavId, status] of Object.entries(item.perUavStatuses)) {
      if (status === 'outdated') {
        delete result[uavId];
      } else {
        result[uavId] = mapStatus(status);
      }
    }
  }

  return result;
}

/**
 * Creates a history item from the given job result, queues, and errors.
 */
export function createHistoryItem(
  result: UploadJobResult,
  queues: { itemsFinished: Identifier[]; failedItems: Identifier[] },
  errors: Record<Identifier, string>
): HistoryItem {
  const perUavStatuses: Record<Identifier, UAVStatus> = {};
  for (const uavId of queues.itemsFinished) {
    perUavStatuses[uavId] = 'success';
  }
  for (const uavId of queues.failedItems) {
    perUavStatuses[uavId] = 'error';
  }

  return {
    result,
    perUavStatuses,
    perUavErrors: { ...errors },
  };
}

/**
 * Record that maps upload job results to their priority/severity level.
 */
const COMPACTION_RESULT_PRIORITY: Record<UploadJobResult, number> = {
  success: 0,
  cancelled: 1,
  error: 2,
};

/**
 * Compacts a history array if it exceeds `maxSize`. The last
 * `Math.floor(maxSize / 2)` items are kept as-is; the overflow is
 * merged into a single item where per-UAV statuses and errors
 * are layered chronologically (newer overrides older).
 */
export function compactHistory(
  history: HistoryItem[],
  maxSize = 8
): HistoryItem[] {
  if (maxSize < 1) {
    return EMPTY_ARRAY;
  }

  if (history.length <= maxSize) {
    return history;
  }

  const keepCount = Math.floor(maxSize / 2);
  const mergeUntil = history.length - keepCount;

  const perUavStatuses: Record<Identifier, UAVStatus> = {};
  const perUavErrors: Record<Identifier, string> = {};
  let worstResult: UploadJobResult = 'success';

  for (let i = 0; i < mergeUntil; i++) {
    const item = history[i];
    Object.assign(perUavStatuses, item.perUavStatuses);
    Object.assign(perUavErrors, item.perUavErrors);

    if (
      COMPACTION_RESULT_PRIORITY[item.result] >
      COMPACTION_RESULT_PRIORITY[worstResult]
    ) {
      worstResult = item.result;
    }
  }

  const compacted: HistoryItem = {
    result: worstResult,
    perUavStatuses,
    perUavErrors,
  };

  return [compacted, ...history.slice(mergeUntil)];
}

/**
 * Pushes a new history item into the history of the given job type.
 */
export function pushItemToHistory(
  history: Record<string, HistoryItem[]>,
  jobType: string,
  item: HistoryItem
) {
  const historyItems = history[jobType] ?? [];
  historyItems.push(item);
  history[jobType] = compactHistory(historyItems);
}
