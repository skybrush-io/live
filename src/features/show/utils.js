import arrify from 'arrify';
import isNil from 'lodash-es/isNil';
import pull from 'lodash-es/pull';
import without from 'lodash-es/without';

const ALL_QUEUES = [
  'failedItems',
  'itemsInProgress',
  'itemsWaitingToStart',
  'itemsQueued',
  'itemsFinished',
];

/**
 * Helper factory that returns a reducer function that ensures that one or more
 * upload items are to be found in one of the allowed upload status queues.
 *
 * It is assumed that the payload of the action will be the ID of the UAV that
 * is to be moved between queues, or an array of such IDs.
 *
 * @param {string} target  name of the target array that the items should be
 *        after calling this function. May be undefined to remove the item from
 *        all queues except the ones specified in 'alsoAllowedIn'.
 * @param {string} doNotMoveWhenIn  name of an additional queue or more additional queues that the items are
 *        allowed to remain in if they are already there
 */
export const ensureItemsInQueue = ({ target, doNotMoveWhenIn } = {}) => {
  doNotMoveWhenIn = arrify(doNotMoveWhenIn);

  const allOtherQueues = without(ALL_QUEUES, target, ...doNotMoveWhenIn);

  return (state, action) => {
    const uavIds = arrify(action.payload);
    const targetQueue = target ? state.upload[target] : undefined;

    for (const queueName of allOtherQueues) {
      const queue = state.upload[queueName];
      pull(queue, ...uavIds);
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
 * @param {string} source  name of the source array (queue) in `state.upload`
 *        to remove the item from. The action becomes a no-op for a particular
 *        item if it is not in the specified source queue.
 * @param {string} target  name of the target array (queue) in `state.upload`
 *        to add the item to; `undefined` means not to add the item to a new
 *        queue
 */
export const moveItemsBetweenQueues =
  ({ source, target }) =>
  (state, action) => {
    const uavIds = arrify(action.payload);
    const sourceQueue = state.upload[source];
    const targetQueue = target ? state.upload[target] : undefined;

    for (const uavId of uavIds) {
      const index = sourceQueue.indexOf(uavId);
      if (index >= 0) {
        const item = sourceQueue[index];
        sourceQueue.splice(index, 1);
        if (targetQueue) {
          targetQueue.push(item);
        }
      }
    }
  };
