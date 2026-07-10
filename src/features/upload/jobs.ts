import type { ProgressStatus } from '~/flockwave/messages';
import type { AppThunk, RootState } from '~/store/reducers';

import type { JobData, JobPayload, Outcome } from './types';

export enum JobScope {
  ALL = 'all',
  COMPATIBLE = 'compatible',
  MISSION = 'mission',
  SINGLE = 'single',
}

export type JobExecutorParams<Payload = JobPayload, Data = void> = {
  uavId: string;
  payload: Payload;
  data: Data;
};

/**
 * Object describing a single job type that we can execute.
 *
 * A job is a long-running process that affects multiple UAVs and that may optionally
 * produce a result object aggregated from inidividual commands executed on different
 * UAVs. The archetypical example of a job is the upload of a show to multiple drones,
 * but other job types also exist: firmware updates, parameter uploads, parameter
 * consistency checks and so on.
 */
export type JobSpecification<
  Payload = void,
  Data = void,
  ResultPiece = void,
  Result = unknown,
> = {
  /**
   * The type of the job, i.e. a unique string identifier.
   */
  type: string;

  /**
   * The title of the job, used in dialog boxes.
   */
  title?: string;

  /**
   * The scope of the job, i.e. the set of UAVs that the job can operate on. Must be
   * one of `all` (all UAVs, irrespectively of whether they are mapped in the current
   * mission or not), `compatible` (subset of UAVs that support a given upload type,
   * e.g. firmware update target), `mission` (UAVs that are in the current mission
   * mapping) or `single` (single selected UAV in the UAVs list). The default is `all`.
   */
  scope?: JobScope;

  /**
   * Redux selector that is called before executing the job for a single UAV. The
   * selector is called with the Redux state and the ID of the UAV that the job is
   * targeting, and it can return an arbitrary object that will be forwarded to the
   * executor (see below in the `executor` for more details).
   *
   * The selector is effectively the "demultiplexer" that produces the UAV-specific part
   * of the data that the job needs to work with.
   *
   * @param state - the Redux state
   * @param uavId - the ID of the UAV that the job will execute on
   */
  selector?: (state: RootState, uavId: string) => Data;

  /**
   * An asynchronous function or saga that executes the job for a single UAV (e.g.,
   * uploads a drone show specification to a single UAV). This function runs in the
   * context of a worker saga, which is blocked until the promise returned from the
   * executor resolves or rejects.
   *
   * It is recommended to use an executor _saga_ or to make the executor return a
   * _cancellable_ promise to facilitate the cancellation of tasks.
   *
   * @param params.uavId - the ID of the UAV that is targeted by the job
   * @param params.payload - the payload of the original job specification. The
   *        semantics of the payload depends solely on the type of the job being
   *        executed
   * @param params.data - the state slice that was extracted by the selector associated
   *        to the job type
   * @param options.onProgress - handler function that is called whenever the progress
   *        of the job was updated (for jobs that support progress reporting)
   * @returns - a result piece that will be passed on to the result aggregator (updater)
   *        function of the job
   */
  executor: (
    params: JobExecutorParams<Payload, Data>,
    options: {
      onProgress: (id: string, status: ProgressStatus) => void;
    }
  ) => Promise<ResultPiece> | Generator<unknown, ResultPiece>;

  /**
   * Object describing how the final job result is created from the individual result
   * pieces returned by the executed tasks.
   *
   * If not specified, it is assumed that the job produces no result.
   */
  result?: {
    /**
     * Creates a new result object from scratch.
     */
    create: () => Result;

    /**
     * Updates a result object with a result piece returned by a task.
     *
     * Defaults to a no-op if not specified.
     *
     * @param result - the result to update
     * @param piece - the result piece to merge into the result
     * @param uavId - ID of the UAV that produced the piece
     * @returns - a new (or the same) result object to use in subsequent updates.
     *     `undefined` means to keep on using the same result object.
     */
    update?: (
      result: Result,
      piece: ResultPiece,
      uavId: string
    ) => Result | undefined;

    /**
     * Finalizes a result object when all tasks have been executed.
     *
     * Defaults to a no-op if not specified.
     *
     * Called even if some of the tasks in the job failed or have been cancelled.
     *
     * @param result - the result to finalize
     * @param piece - the result piece to merge into the result
     * @returns - a new (or the same) result object to use in subsequent updates.
     *     `undefined` means to keep on using the same result object.
     */
    finalize?: (result: Result) => Result | undefined;
  };

  /**
   * Function that returns an optional Redux thunk to dispatch at the end of the job,
   * after having produced the final result object.
   */
  postAction?: (result: Result | undefined) => AppThunk;

  /**
   * A saga that is responsible for the top-level scheduling of the tasks in the job,
   * related to the individual UAVs. The executor defaults to
   * `forkingWorkerManagementSaga`.
   *
   * This is an advanced parameter. Typically you will not need to provide an
   * alternative worker manager.
   *
   * @param spec - the specification of the job (i.e. this object)
   * @param job - the current job data (consisting of a type and a payload).
   * @returns - the aggregated result object from all the pieces yielded by the
   *      UAV-specific tasks in the job
   */
  workerManager?: (
    spec: JobSpecification<Payload, Data, ResultPiece, Result>,
    job: JobData
  ) => Promise<Outcome<Result>>;
};

/**
 * Mapping from known job types to the async functions that handle them.
 *
 * You can register new entries in this map from other modules with
 * `registerUploadJobType()`.
 */
const JOB_TYPE_TO_SPEC_MAP: Record<string, JobSpecification<unknown>> = {};

/**
 * Returns the job specification object corresponding to the given job type,
 * or null if there is no such job type.
 */
export function getSpecificationForJobType(
  type: string
): JobSpecification<unknown> | undefined {
  return JOB_TYPE_TO_SPEC_MAP[type] ?? undefined;
}

/**
 * Returns the title to show for jobs of a given type in dialog boxes.
 */
export function getDialogTitleForJobType(type: string): string {
  return getSpecificationForJobType(type)?.title ?? 'Upload data';
}

/**
 * Returns the scope of an upload job with the given type.
 */
export function getScopeForJobType(type: string): JobScope {
  return getSpecificationForJobType(type)?.scope ?? JobScope.ALL;
}

/**
 * Registers a new job type specification.
 *
 * See the documentation of `JOB_TYPE_TO_SPEC_MAP` for more information about
 * the specification.
 *
 * @returns a disposer function that can be called to unregister the job type
 */
export function registerUploadJobType(
  spec: JobSpecification<unknown>
): () => void {
  const type = spec?.type;

  if (typeof type !== 'string' || type.length === 0) {
    throw new Error('Job specification does not have a type');
  }

  const existingSpec = JOB_TYPE_TO_SPEC_MAP[type];
  if (existingSpec) {
    throw new Error(`Upload job type ${type} is already registered`);
  }

  if (!spec.executor) {
    throw new Error('Job specification does not have an executor');
  }

  JOB_TYPE_TO_SPEC_MAP[type] = spec;

  return () => {
    delete JOB_TYPE_TO_SPEC_MAP[type];
  };
}
