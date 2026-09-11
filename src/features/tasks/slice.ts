import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { ProgressInfo } from '~/flockwave/messages';

import type { TaskData, TaskKey, TaskResult, TaskState } from './types';
import { getTaskKey } from './utils';

const initialState: Record<string, TaskState> = {};

const { actions, reducer } = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    clearTasks: () => initialState,
    _startTask(state, action: PayloadAction<TaskData>) {
      const key = getTaskKey(action.payload);
      state[key] = { ...action.payload, status: 'running' };
    },

    _setTaskProgress(
      state,
      action: PayloadAction<{ key: TaskKey; progress: ProgressInfo }>
    ) {
      const { key, progress } = action.payload;
      const entry = state[key];
      if (entry) {
        if (entry.status === 'suspended') {
          entry.status = 'running';
        }
        entry.progress = progress;
      }
    },

    _suspendTask(
      state,
      action: PayloadAction<{ key: TaskKey; progress: ProgressInfo }>
    ) {
      const { key, progress } = action.payload;
      const entry = state[key];
      if (entry) {
        entry.status = 'suspended';
        entry.progress = progress;
      }
    },

    _completeTask(
      state,
      action: PayloadAction<{ key: TaskKey; result?: TaskResult }>
    ) {
      const { key, result } = action.payload;
      const entry = state[key];
      if (entry) {
        entry.status = 'success';
        entry.result = result;
      }
    },

    _failTask(state, action: PayloadAction<{ key: TaskKey; error: string }>) {
      const { key, error } = action.payload;
      const entry = state[key];
      if (entry) {
        entry.status = 'error';
        entry.error = error;
      }
    },

    _clearTask(state, action: PayloadAction<TaskKey>) {
      delete state[action.payload];
    },
  },
});

export const {
  clearTasks,
  _startTask,
  _setTaskProgress,
  _suspendTask,
  _completeTask,
  _failTask,
  _clearTask,
} = actions;

export default reducer;
