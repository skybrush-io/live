import type { ProgressInfo } from '~/flockwave/messages';

// -- Task data

/* Tasks are long-running operations on the server whose state we wish to track in the
 * Redux store in order to have a central place where the UI widgets can go to if they
 * need the state of a long-running operation.
 *
 * The common fields of each task are as follows:
 *
 * - type: the type of the task (can be used as a discriminator in the type union)
 * - taskId: a supposedly unique identifier of the task within the scope of all tasks
 *   with the same type affecting the same UAV.
 * - uavId: ID of the UAV that the task applies to
 *
 * A globally unique key for each task may thus be derived from the combination of the
 * type, taskId, and uavId fields. This is done by the `getTaskKey()` utility function
 * in `utils.ts`.
 */

/**
 * Type representing the task of downloading a log from a UAV.
 */
export type LogDownloadTaskData = {
  uavId: string;
  type: 'log-download';
  taskId: string;
};

/**
 * Type representing the task of running a test on a UAV.
 */
export type UAVTestTaskData = {
  uavId: string;
  type: 'uav-test';
  taskId: string;
};

/**
 * Union type for all tasks that we support.
 */
export type TaskData = LogDownloadTaskData | UAVTestTaskData;

/** Type of the discriminator field for tasks */
export type TaskType = TaskData['type'];

// ---- Task spec (data + params, what callers pass to start) ----

/* Besides the common task fields, each task may have additional data that is required to
 * execute the task on the server. A task data object extended with these parameters is
 * called the _specification_ of the task.
 */

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

/* Besides the common task fields, each task may have additional data that is returned
 * by the server when the task is finished. The task data object extended with
 * the result of the task that the server provides is called the _result_ of the task.
 */

export type LogDownloadTaskResult = LogDownloadTaskData & {
  result: { hash: string };
};

export type UAVTestTaskResult = UAVTestTaskData & { result?: undefined };

export type CompleteTaskResult = LogDownloadTaskResult | UAVTestTaskResult;

// -- Task status

/* The possible statuses of a task. A task may be running or may have terminated
 * successfully or with an error. */
export type TaskStatus = 'running' | 'success' | 'error';

/* Some tasks are also suspendable by the server if the server needs action from the
 * user to continue the task. (One example is accelerometer calibration for ArduPilot-based
 * drones. This type extends the regular task status with a 'suspended' option */
export type SuspendableTaskStatus = TaskStatus | 'suspended';

// -- Task state

/* The _state_ of the task consists of an optional progress information object, an
 * optional error message and a mandatory task status (running, success, error, or
 * suspended). */
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
