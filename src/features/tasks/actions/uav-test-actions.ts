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
import type { UAVTestTaskData, UAVTestTaskSpec } from '../types';
import { getTaskKey } from '../utils';

type ActiveOperation = {
  resume?: ProgressStatus['resume'];
};

const activeOperations = new Map<string, ActiveOperation>();

export const runUAVTestTask =
  (spec: UAVTestTaskSpec): AppThunk =>
  async (dispatch) => {
    const { uavId, type, taskId, params } = spec;
    const { component, command, timeout } = params;
    const key = getTaskKey(spec);

    const onProgress = ({ progress, suspended, resume }: ProgressStatus) => {
      if (suspended) {
        dispatch(_suspendTask({ uavId, type, taskId, progress }));
        if (resume) {
          activeOperations.set(key, { resume });
        }
      } else {
        dispatch(_setTaskProgress({ uavId, type, taskId, progress }));
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
      dispatch(_completeTask({ uavId, type, taskId }));
    } catch (error: unknown) {
      dispatch(_failTask({ uavId, type, taskId, error: errorToString(error) }));
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
