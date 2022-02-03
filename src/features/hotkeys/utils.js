import { getSelectedUAVIds } from '~/features/uavs/selectors';

/**
 * Helper function that takes a Redux action factory that takes a list of UAV
 * IDs as its first argument, and returns a Redux thunk action factory that
 * invokes the original action factory with the currently selected UAVs and
 * dispatches whatever the original factory returned.
 *
 * @param {function} actionFactory  the original action factory
 * @param  {...any} args  additional arguments to pass to the original action factory
 * @returns a Redux thunk action factory that takes no arguments and returns a
 *          thunk action that will dispatch the original action with the current
 *          UAV selection
 */
export const callOnSelection =
  (actionFactory, ...args) =>
  () =>
  (dispatch, getState) => {
    dispatch(actionFactory(getSelectedUAVIds(getState()), ...args));
  };
