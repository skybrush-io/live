import type { CollectiveRTHPlanStatisticsEntry } from '@skybrush/flockwave-spec';

import type { ProgressInfo } from '~/flockwave/messages';
import type { CollectiveRTHParameters } from '~/flockwave/types';

// -- Task data

/* Tasks are long-running operations on the server whose state we wish to track in the
 * Redux store in order to have a central place where the UI widgets can go to if they
 * need the state of a long-running operation.
 *
 * The common fields of each task are as follows:
 *
 * - type: the type of the task (can be used as a discriminator in the type union)
 * - taskId: a supposedly unique identifier of the task within the scope of all tasks
 *   with the same type affecting the same UAV. Optional for singleton tasks where at
 *   most one task of a given type may exist at any given time.
 * - uavId: ID of the UAV that the task applies to. Optional for tasks that are not
 *   tied to a specific UAV.
 *
 * A globally unique key for each task may thus be derived from the combination of the
 * type and the optional taskId and uavId fields. This is done by the `getTaskKey()`
 * utility function in `utils.ts`. The key is the sole identity used by the internal
 * actions of the slice; the identity fields themselves are only needed when a task is
 * started.
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
 * Type representing the singleton task of calculating a collective RTH plan
 * for the entire swarm from the show file that is currently loaded. Not tied
 * to a specific UAV, and there is at most one such task in the system, hence
 * the absence of both `uavId` and `taskId`.
 */
export type RTHPlanTaskData = {
  type: 'rth-plan';
};

/**
 * Union type for all tasks that we support.
 */
export type TaskData = LogDownloadTaskData | UAVTestTaskData | RTHPlanTaskData;

/** Type of the discriminator field for tasks */
export type TaskType = TaskData['type'];

const _TaskKey: unique symbol = Symbol('TaskKey');

/**
 * Named type for task keys, created by `getTaskKey()` in `utils.ts`.
 * Used as the sole identity in the internal actions of the slice. The unique
 * symbol prevents accidental confusion with arbitrary strings.
 */
export type TaskKey = string & { [_TaskKey]: void };

// ---- Task parameters ----

/* Besides the common task fields, each task may have additional parameters that are
 * required to execute the task on the server.
 */

export type LogDownloadTaskParams = { logId: string };
export type UAVTestTaskParams = {
  component: string;
  command: 'test' | 'calib';
  timeout?: number;
};
export type RTHPlanTaskParams = CollectiveRTHParameters;

// ---- Task results ----

/* Besides the common task fields, each task may have additional data that is returned
 * by the server when the task is finished. The task data object extended with
 * the result of the task that the server provides is called the _result_ of the task.
 */

export type LogDownloadTaskResult = { hash: string };
export type UAVTestTaskResult = undefined;
export type RTHPlanTaskResult = {
  /** Hash of the transformed show; the show itself lives in the payload store
   * (`payload-store.ts`). */
  hash: string;
  stats: CollectiveRTHPlanStatisticsEntry[];
  showDuration: number;
  firstTime: number;
  lastTime: number;
  minRTHAltitude?: number;
};

// ---- Task spec (data + params, what callers pass to start) ----

/* These types combine the task result with the task parameters such that the parameters
 * become an additional field of the data object */

type WithParams<TParams, TData> = TData & {
  params: TParams;
};

export type LogDownloadTaskSpec = WithParams<
  LogDownloadTaskParams,
  LogDownloadTaskData
>;
export type UAVTestTaskSpec = WithParams<UAVTestTaskParams, UAVTestTaskData>;
export type RTHPlanTaskSpec = WithParams<RTHPlanTaskParams, RTHPlanTaskData>;

export type TaskSpec = LogDownloadTaskSpec | UAVTestTaskSpec | RTHPlanTaskSpec;

/** Union of the task data types that are tied to a specific UAV. */
export type UAVTaskData = Extract<TaskData, { uavId: string }>;

/** Union of the task spec types that are tied to a specific UAV. */
export type UAVTaskSpec = Extract<TaskSpec, { uavId: string }>;

// ---- Task data with result ----

/* These types combine the task result with the task data such that the result
 * becomes an additional field of the data object */

type WithResult<TResult, TData> = TData & {
  result?: TResult;
};

export type LogDownloadTaskDataWithResult = WithResult<
  LogDownloadTaskResult,
  LogDownloadTaskData
>;
export type UAVTestTaskDataWithResult = WithResult<
  UAVTestTaskResult,
  UAVTestTaskData
>;
export type RTHPlanTaskDataWithResult = WithResult<
  RTHPlanTaskResult,
  RTHPlanTaskData
>;

type CompleteTaskResult =
  | LogDownloadTaskDataWithResult
  | UAVTestTaskDataWithResult
  | RTHPlanTaskDataWithResult;

/** Result payload of a task, without the identity fields. */
export type TaskResult = CompleteTaskResult['result'];

// -- Task status

/* The possible statuses of a task. A task may be running, suspended, terminated
 * successfully or terminated with an error. */
export type TaskStatus = 'running' | 'success' | 'error' | 'suspended';

// -- Task state

/* The _state_ of the task consists of an optional progress information object, an
 * optional error message and a mandatory task status (running, success, error, or
 * suspended). */
type TaskStateBase = {
  status: TaskStatus;
  progress?: ProgressInfo;
  error?: string;
};

export type LogDownloadTaskState = TaskStateBase &
  LogDownloadTaskDataWithResult;
export type UAVTestTaskState = TaskStateBase & UAVTestTaskDataWithResult;
export type RTHPlanTaskState = TaskStateBase & RTHPlanTaskDataWithResult;

export type TaskState =
  LogDownloadTaskState | UAVTestTaskState | RTHPlanTaskState;

export type AggregatedTaskState = {
  loading: boolean;
  numItems: number;
  numSuccess: number;
  numError: number;
};

// ---- Task start options ----

export type StartOptions = {
  silent?: boolean;
};
