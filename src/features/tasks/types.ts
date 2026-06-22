import type { ProgressInfo } from '~/flockwave/messages';

// -- Task data

export type LogDownloadTaskData = {
  uavId: string;
  type: 'log-download';
  taskId: string;
};

export type UAVTestTaskData = {
  uavId: string;
  type: 'uav-test';
  taskId: string;
};

export type TaskData = LogDownloadTaskData | UAVTestTaskData;
export type TaskType = TaskData['type'];

// ---- Task spec (data + params, what callers pass to start) ----

export type LogDownloadTaskSpec = LogDownloadTaskData & {
  params: { logId: string };
};

export type UAVTestTaskSpec = UAVTestTaskData & {
  params: {
    component: string;
    command: 'test' | 'calib';
    timeout?: number;
  };
};

export type TaskSpec = LogDownloadTaskSpec | UAVTestTaskSpec;

// -- Task result

export type LogDownloadTaskResult = LogDownloadTaskData & {
  result: { hash: string };
};

export type UAVTestTaskResult = UAVTestTaskData & { result?: undefined };

export type CompleteTaskResult = LogDownloadTaskResult | UAVTestTaskResult;

// -- Task status

export type TaskStatus = 'running' | 'success' | 'error';
export type SuspendableTaskStatus = TaskStatus | 'suspended';

// -- Task state

type TaskStateBase = {
  progress?: ProgressInfo;
  error?: string;
};

export type LogDownloadTaskState = TaskStateBase &
  LogDownloadTaskData & {
    status: TaskStatus;
    result?: { hash: string };
  };

export type UAVTestTaskState = TaskStateBase &
  UAVTestTaskData & {
    status: SuspendableTaskStatus;
    result?: never;
  };

export type TaskState = LogDownloadTaskState | UAVTestTaskState;
