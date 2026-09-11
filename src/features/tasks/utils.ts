import type { TaskData, TaskKey, TaskState } from './types';

/**
 * Returns a string that uniquely identifies a task based on its type and the
 * optional UAV ID and task ID that the task is associated to.
 */
export const getTaskKey = (data: TaskData): TaskKey =>
  // Branded type: the cast only attaches the brand to an ordinary string.
  [data.type, data.uavId ?? '_', data.taskId ?? '_'].join(':') as TaskKey;

/**
 * Returns whether the given task is currently in progress
 * (running or suspended).
 */
export const isTaskInProgress = (task?: TaskState): boolean =>
  task?.status === 'running' || task?.status === 'suspended';
