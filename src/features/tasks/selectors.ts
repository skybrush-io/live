import { createSelector } from '@reduxjs/toolkit';

import type { FlightLog } from '~/model/flight-logs';
import type { AppSelector, RootState } from '~/store/reducers';

import { readDownloadedLog } from './actions/log-download-actions';
import type {
  AggregatedTaskState,
  LogDownloadTaskData,
  TaskData,
  TaskState,
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
 * Factory that creates a memoized selector returning an aggregation of
 * task states for the UAV IDs produced by `getUAVIds`.
 */
export const createAggregatedTaskStateSelector = (
  getUAVIds: AppSelector<string[]>,
  taskData: Omit<TaskData, 'uavId'>
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
