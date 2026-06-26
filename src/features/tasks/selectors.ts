import type { FlightLog } from '~/model/flight-logs';
import type { RootState } from '~/store/reducers';

import { readDownloadedLog } from './actions/log-download-actions';
import type { LogDownloadTaskData, TaskData, TaskState } from './types';
import { getTaskKey } from './utils';

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
