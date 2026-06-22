import type { TaskData } from './types';

export const getTaskKey = (data: TaskData): string =>
  `${data.type}:${data.uavId}:${data.taskId}`;
