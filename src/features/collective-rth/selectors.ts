import { createSelector } from '@reduxjs/toolkit';

import type { RTHPlanTaskResult, RTHPlanTaskState } from '~/features/tasks';
import { getTaskState, readTaskPayload } from '~/features/tasks';
import type { ProgressInfo } from '~/flockwave/messages';
import type { CollectiveRTHParameters } from '~/flockwave/types';
import type { AppSelector } from '~/store/reducers';
import type { CollectiveRTHDialogState } from './slice';

const selectState: AppSelector<CollectiveRTHDialogState> = (state) =>
  state.dialogs.collectiveRTH;

export const isDialogOpen: AppSelector<boolean> = (state) =>
  selectState(state).open;

/**
 * Returns the default parameters of a collective RTH plan calculation, as
 * persisted between application restarts.
 */
export const selectParameters: AppSelector<CollectiveRTHParameters> = (state) =>
  selectState(state).parameters;

/**
 * Returns the state of the singleton collective RTH plan calculation task,
 * or `undefined` if no such task has been started yet.
 */
export const selectRTHPlanTask: AppSelector<RTHPlanTaskState | undefined> = (
  state
) => getTaskState(state, { type: 'rth-plan' });

/**
 * The current phase of the collective RTH plan calculation task. The task is
 * considered idle if it has not been started yet or it has no notable status.
 */
export type RTHPlanTaskPhase = 'idle' | 'running' | 'error' | 'success';

/**
 * Returns the current phase of the collective RTH plan calculation task.
 */
export const selectRTHPlanTaskPhase: AppSelector<RTHPlanTaskPhase> =
  createSelector(selectRTHPlanTask, (task) => {
    switch (task?.status) {
      case 'running':
        return 'running';
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'idle';
    }
  });

/**
 * Returns the progress information of the collective RTH plan calculation
 * task while it is running, or `undefined` otherwise.
 */
export const selectRTHPlanTaskProgress: AppSelector<ProgressInfo | undefined> =
  createSelector(selectRTHPlanTask, (task) =>
    task?.status === 'running' ? task.progress : undefined
  );

/**
 * Returns the result of the most recent successful collective RTH plan
 * calculation, or `undefined` if there is no such calculation.
 */
export const selectRTHPlanTaskResult: AppSelector<
  RTHPlanTaskResult | undefined
> = createSelector(selectRTHPlanTask, (task) =>
  task?.status === 'success' ? task.result : undefined
);

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
