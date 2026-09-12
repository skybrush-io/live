import type { RTHPlanTaskState } from '~/features/tasks';
import { getTaskState, readTaskPayload } from '~/features/tasks';
import type { AppSelector } from '~/store/reducers';
import type { CollectiveRTHDialogState } from './slice';

const selectState: AppSelector<CollectiveRTHDialogState> = (state) =>
  state.dialogs.collectiveRTH;

export const isDialogOpen: AppSelector<boolean> = (state) =>
  selectState(state).open;

/**
 * Returns the state of the singleton collective RTH plan calculation task,
 * or `undefined` if no such task has been started yet.
 */
export const selectRTHPlanTask: AppSelector<RTHPlanTaskState | undefined> = (
  state
) => getTaskState(state, { type: 'rth-plan' });

/**
 * Returns the base64-encoded show with the collective RTH plans appended from
 * the most recent successful collective RTH plan calculation, or `undefined`
 * if there is no such calculation or its result is no longer available.
 */
export const selectCalculatedShowWithRTHPlan: AppSelector<
  string | undefined
> = (state) => {
  const task = selectRTHPlanTask(state);
  if (task?.status !== 'success' || task.result === undefined) {
    return undefined;
  }

  return readTaskPayload<string>(task.result.hash);
};
