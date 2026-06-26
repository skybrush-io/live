import type { TaskData, TaskState } from './types';

/**
 * Returns a string that uniquely identifies a task based on its type,task ID, and the
 * UAV that it is associated to.
 */
export const getTaskKey = (data: TaskData): string =>
  `${data.type}:${data.uavId}:${data.taskId}`;

/**
 * Returns whether the given task is currently in progress
 * (running or suspended).
 */
export const isTaskInProgress = (task?: TaskState): boolean =>
  task?.status === 'running' || task?.status === 'suspended';
