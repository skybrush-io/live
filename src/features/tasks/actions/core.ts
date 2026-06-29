import type { AppThunk } from '~/store/reducers';

import { _clearTask, _startTask } from '../slice';
import type { StartOptions, TaskData, TaskSpec } from '../types';
import { getTaskKey, isTaskInProgress } from '../utils';
import { runLogDownloadTask } from './log-download';
import {
  clearUAVTestTask,
  resumeUAVTestTask,
  runUAVTestTask,
} from './uav-test';

/**
 * Starts the given task unless it is already in progress.
 *
 * Returns `undefined` if the task is already in progress, otherwise returns a
 * `Promise` that resolves when the task completes.
 */
export const startTask =
  (
    spec: TaskSpec,
    { silent = false }: StartOptions = {}
  ): AppThunk<Promise<void> | undefined> =>
  (dispatch, getState) => {
    // Ignore duplicate starts if the task is already running or suspended.
    const existing = getState().tasks[getTaskKey(spec)];
    if (isTaskInProgress(existing)) {
      return;
    }

    dispatch(_startTask(spec));

    switch (spec.type) {
      case 'log-download':
        return dispatch(
          runLogDownloadTask(spec, {
            retry: () => void dispatch(startTask(spec, { silent })),
          })
        );
      case 'uav-test':
        return dispatch(runUAVTestTask(spec, { silent }));
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
