import { errorToString } from '~/error-handling';
import type { ProgressStatus } from '~/flockwave/messages';
import messageHub from '~/message-hub';
import type { AppThunk } from '~/store/reducers';

import {
  _completeTask,
  _failTask,
  _setTaskProgress,
  _suspendTask,
} from '../slice';
import type {
  StartOptions,
  TaskKey,
  UAVTestTaskData,
  UAVTestTaskSpec,
} from '../types';
import { getTaskKey } from '../utils';

type ActiveOperation = {
  resume?: ProgressStatus['resume'];
};

const activeOperations = new Map<TaskKey, ActiveOperation>();

export const runUAVTestTask =
  (spec: UAVTestTaskSpec, _opts: StartOptions = {}): AppThunk<Promise<void>> =>
  async (dispatch) => {
    const { uavId, params } = spec;
    const { component, command, timeout } = params;
    const key = getTaskKey(spec);

    const onProgress = ({ progress, suspended, resume }: ProgressStatus) => {
      if (suspended) {
        dispatch(_suspendTask({ key, progress }));
        if (resume) {
          activeOperations.set(key, { resume });
        }
      } else {
        dispatch(_setTaskProgress({ key, progress }));
      }
    };

    try {
      await messageHub.sendCommandRequest(
        {
          uavId,
          command,
          args: [component],
        },
        { onProgress, timeout }
      );
      dispatch(_completeTask({ key }));
    } catch (error: unknown) {
      dispatch(_failTask({ key, error: errorToString(error) }));
    } finally {
      activeOperations.delete(key);
    }
  };

export const resumeUAVTestTask =
  (data: UAVTestTaskData): AppThunk =>
  async () => {
    const operation = activeOperations.get(getTaskKey(data));
    if (operation?.resume) {
      await operation.resume();
    }
  };

export const clearUAVTestTask =
  (data: UAVTestTaskData): AppThunk =>
  () => {
    activeOperations.delete(getTaskKey(data));
  };
