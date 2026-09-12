import { createSelector } from '@reduxjs/toolkit';

import type { FlightLog } from '~/model/flight-logs';
import type { AppSelector, RootState } from '~/store/reducers';

import { readDownloadedLog } from './actions/log-download';
import { readCalculatedShow } from './actions/rth-plan';
import type {
  AggregatedTaskState,
  LogDownloadTaskData,
  TaskData,
  TaskState,
  UAVTaskData,
} from './types';
import { getTaskKey, isTaskInProgress } from './utils';

export const getTaskState = <T extends TaskData>(
  state: RootState,
  data: T
): Extract<TaskState, { type: T['type'] }> | undefined => {
  const key = getTaskKey(data);
  const task = state.tasks[key];
  if (task === undefined) {
    return undefined;
  }

  if (task.type === data.type) {
    return task as Extract<TaskState, { type: T['type'] }>;
  }

  console.warn(
    `Task state type mismatch: expected ${data.type}, got ${task.type} for key ${key}`
  );
  return undefined;
};

export const getDownloadedLog = (
  state: RootState,
  data: LogDownloadTaskData
): FlightLog | undefined => {
  const task = getTaskState(state, data);
  if (task?.status !== 'success' || task?.result === undefined) {
    return undefined;
  }

  return readDownloadedLog(task.result.hash);
};

/**
 * Returns the base64-encoded show with the collective RTH plans appended from
 * the most recent successful collective RTH plan calculation, or `undefined`
 * if there is no such calculation or its result is no longer available.
 */
export const getCalculatedShowWithRTHPlan = (
  state: RootState
): string | undefined => {
  const task = getTaskState(state, { type: 'rth-plan' });
  if (task?.status !== 'success' || task.result === undefined) {
    return undefined;
  }

  return readCalculatedShow(task.result.hash);
};

/**
 * Factory that creates a memoized selector returning an aggregation of
 * task states for the UAV IDs produced by `getUAVIds`.
 */
export const createAggregatedTaskStateSelector = (
  getUAVIds: AppSelector<string[]>,
  taskData: Omit<UAVTaskData, 'uavId'>
): AppSelector<AggregatedTaskState> =>
  createSelector(
    getUAVIds,
    (state: RootState) => state.tasks,
    (uavIds, tasks): AggregatedTaskState => {
      let loading = false;
      let numSuccess = 0;
      let numError = 0;
      const numItems = uavIds.length;

      for (const uavId of uavIds) {
        const task = tasks[getTaskKey({ uavId, ...taskData })];
        if (task === undefined) {
          continue;
        }

        if (isTaskInProgress(task)) {
          loading = true;
        } else if (task.status === 'success') {
          numSuccess++;
        } else if (task.status === 'error') {
          numError++;
        }
      }

      return { loading, numItems, numSuccess, numError };
    }
  );
