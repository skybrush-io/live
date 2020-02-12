/**
 * Helper factory that returns a reducer function that moves an upload item
 * between upload status queues.
 *
 * It is assumed that the payload of the action will be the ID of the UAV that
 * is to be moved between queues.
 *
 * @param {string} source  name of the source array (queue) in `state.upload`
 *        to remove the item from
 * @param {string} target  name of the target array (queue) in `state.upload`
 *        to add the item to; `undefined` means not to add the item to a new
 *        queue
 */
export const moveItemsBetweenQueues = ({ source, target, state, action }) => {
  const uavIds = Array.isArray(action.payload)
    ? action.payload
    : [action.payload];

  source = state.upload[source];
  target = target ? state.upload[target] : undefined;

  for (const uavId of uavIds) {
    const index = source.indexOf(uavId);
    if (index >= 0) {
      const item = source[index];
      source.splice(index, 1);
      if (target) {
        target.push(item);
      }
    }
  }
};
