import type { AppThunk } from '~/store/reducers';

import { _clearTask, _startTask } from '../slice';
import type { TaskData, TaskSpec } from '../types';
import { getTaskKey } from '../utils';
import { runLogDownloadTask } from './log-download-actions';
import {
  clearUAVTestTask,
  resumeUAVTestTask,
  runUAVTestTask,
} from './uav-test-actions';

export const startTask =
  (spec: TaskSpec): AppThunk =>
  (dispatch, getState) => {
    // Ignore duplicate starts if the task is already running or suspended.
    const existing = getState().tasks[getTaskKey(spec)];
    if (
      existing &&
      (existing.status === 'running' || existing.status === 'suspended')
    ) {
      return;
    }

    dispatch(_startTask(spec));

    switch (spec.type) {
      case 'log-download':
        void dispatch(
          runLogDownloadTask(spec, { retry: () => dispatch(startTask(spec)) })
        );
        return;
      case 'uav-test':
        void dispatch(runUAVTestTask(spec));
        return;
    }
  };

export const resumeTask =
  (data: TaskData): AppThunk =>
  (dispatch) => {
    switch (data.type) {
      case 'log-download':
        return;
      case 'uav-test':
        void dispatch(resumeUAVTestTask(data));
        return;
    }
  };

export const clearTask =
  (data: TaskData): AppThunk =>
  (dispatch) => {
    switch (data.type) {
      case 'log-download':
        break;
      case 'uav-test':
        dispatch(clearUAVTestTask(data));
        break;
    }

    dispatch(_clearTask(data));
  };
