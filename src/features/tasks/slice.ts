import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { ProgressInfo } from '~/flockwave/messages';

import type {
  CompleteTaskResult,
  TaskData,
  TaskState,
  UAVTestTaskData,
} from './types';
import { getTaskKey } from './utils';

const initialState: Record<string, TaskState> = {};

const { actions, reducer } = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    _startTask(state, action: PayloadAction<TaskData>) {
      const { uavId, type, taskId } = action.payload;
      const key = getTaskKey(action.payload);
      state[key] = {
        uavId,
        type,
        taskId,
        status: 'running',
      };
    },

    _setTaskProgress(
      state,
      action: PayloadAction<TaskData & { progress: ProgressInfo }>
    ) {
      const { progress } = action.payload;
      const key = getTaskKey(action.payload);
      const entry = state[key];
      if (entry) {
        entry.progress = progress;
      }
    },

    _suspendTask(
      state,
      action: PayloadAction<UAVTestTaskData & { progress: ProgressInfo }>
    ) {
      const { progress } = action.payload;
      const key = getTaskKey(action.payload);
      const entry = state[key];
      if (entry) {
        entry.status = 'suspended';
        entry.progress = progress;
      }
    },

    _completeTask(state, action: PayloadAction<CompleteTaskResult>) {
      const { result } = action.payload;
      const key = getTaskKey(action.payload);
      const entry = state[key];
      if (entry) {
        entry.status = 'success';
        entry.result = result;
      }
    },

    _failTask(state, action: PayloadAction<TaskData & { error: string }>) {
      const { error } = action.payload;
      const key = getTaskKey(action.payload);
      const entry = state[key];
      if (entry) {
        entry.status = 'error';
        entry.error = error;
      }
    },

    _clearTask(state, action: PayloadAction<TaskData>) {
      const key = getTaskKey(action.payload);
      delete state[key];
    },
  },
});

export const {
  _startTask,
  _setTaskProgress,
  _suspendTask,
  _completeTask,
  _failTask,
  _clearTask,
} = actions;

export default reducer;
