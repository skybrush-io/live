import { getSelectedUAVIds } from '~/features/uavs/selectors';
import type { AppThunk } from '~/store/reducers';

type UavSelectionActionFactory<TArgs extends unknown[]> = (
  uavIds: string[],
  ...args: TArgs
) => Parameters<Parameters<AppThunk>[0]>[0];

/**
 * Helper function that takes a Redux action factory that takes a list of UAV
 * IDs as its first argument, and returns a Redux thunk action factory that
 * invokes the original action factory with the currently selected UAVs and
 * dispatches whatever the original factory returned.
 *
 * @param actionFactory The original action factory.
 * @param args Additional arguments to pass to the original action factory.
 * @returns A Redux thunk action factory that will dispatch the original action
 *   with the current UAV selection.
 */
export const callOnSelection =
  <TArgs extends unknown[]>(
    actionFactory: UavSelectionActionFactory<TArgs>,
    ...args: TArgs
  ): AppThunk =>
  (dispatch, getState) => {
    dispatch(actionFactory(getSelectedUAVIds(getState()), ...args));
  };
