import type { TaskData, TaskState } from './types';

export const getTaskKey = (data: TaskData): string =>
  `${data.type}:${data.uavId}:${data.taskId}`;

/**
 * Returns whether the given task is currently in progress
 * (running or suspended).
 */
export const isTaskInProgress = (task?: TaskState): boolean =>
  task?.status === 'running' || task?.status === 'suspended';
