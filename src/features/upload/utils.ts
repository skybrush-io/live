import arrify from 'arrify';
import isNil from 'lodash-es/isNil';
import pull from 'lodash-es/pull';
import without from 'lodash-es/without';
import {
  type CaseReducer,
  type Draft,
  type PayloadAction,
} from '@reduxjs/toolkit';

import type UAV from '~/model/uav';
import { deleteItemById } from '~/utils/collections';

import { type UploadSliceState } from './slice';

const ALL_QUEUES: Array<keyof UploadSliceState['queues']> = [
  'failedItems',
  'itemsInProgress',
  'itemsWaitingToStart',
  'itemsQueued',
  'itemsFinished',
];

export function clearLastUploadResultForJobTypeHelper(
  state: Draft<UploadSliceState>,
  jobType: string
): void {
  deleteItemById(state.history, jobType);
}

export function clearQueues(state: Draft<UploadSliceState>): void {
  state.queues.failedItems = [];
  state.queues.itemsFinished = [];
  state.queues.itemsQueued = [];
  state.queues.itemsWaitingToStart = [];
  state.errors = {};
  state.dialog.showLastUploadResult = false;
}

/**
 * Helper function to remove the stored error messages for all the UAVs in the
 * given array.
 */
function removeErrorsForUAVs(
  state: Draft<UploadSliceState>,
  uavIds: Array<UAV['id']>
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
  PayloadAction<UAV['id'] | Array<UAV['id']>>
> => {
  const allOtherQueues = without(
    ALL_QUEUES,
    ...(target ? [target] : []),
    ...doNotMoveWhenIn
  );

  return (state, action) => {
    const uavIds = arrify(action.payload);
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
  }): CaseReducer<
    UploadSliceState,
    PayloadAction<UAV['id'] | Array<UAV['id']>>
  > =>
  (state, action) => {
    const uavIds = arrify(action.payload);
    const sourceQueue = state.queues[source];
    const targetQueue = target ? state.queues[target] : undefined;

    for (const uavId of uavIds) {
      const index = sourceQueue.indexOf(uavId);
      if (index >= 0) {
        sourceQueue.splice(index, 1);
        if (targetQueue) {
          targetQueue.push(uavId);
        }
      }
    }

    if (source === 'failedItems') {
      removeErrorsForUAVs(state, uavIds);
    }
  };
