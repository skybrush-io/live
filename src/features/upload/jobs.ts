import type { ProgressStatus } from '~/flockwave/messages';
import type { RootState } from '~/store/reducers';

import type { JobData, JobPayload } from './types';

export enum JobScope {
  ALL = 'all',
  COMPATIBLE = 'compatible',
  MISSION = 'mission',
  SINGLE = 'single',
}

export type JobExecutorParams<T> = {
  uavId: string;
  payload: JobPayload;
  data: T;
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
export type JobSpecification<T> = {
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
  selector?: (state: RootState, uavId: string) => T;

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
    params: JobExecutorParams<T>,
    options: {
      onProgress: (id: string, status: ProgressStatus) => void;
    }
  ) => Promise<void>;

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
   */
  workerManager?: (spec: JobSpecification<T>, job: JobData) => Promise<void>;
};

/**
 * Mapping from known job types to the async functions that handle them.
 *
 * Each entry in this map consists of:
 *
 * - `type`: the type of the job, i.e. a unique string identifier
 * - `title`: the title of the job, used in dialog boxes
 * - `scope`: the scope of the job, i.e. the set of UAVs that the job can
 *   operate on. Must be one of `all` (all UAVs, irrespectively of whether they
 *   are mapped in the current mission or not), `compatible` (subset of UAVs
 *   that support a given upload type, e.g. firmware update target), `mission`
 *   (UAVs that are in the current mission mapping) or `single` (single
 *   selected UAV in the UAVs list). The default is `all`. Use the `JobScope`
 *   enum when referring to these strings from code.
 * - `selector`: a Redux selector that is called before executing the job for a
 *   single UAV. The selector is called with the Redux state and the ID of the
 *   UAV that the job is targeting, and it can return an arbitrary object that
 *   will be forwarded to the executor (see below in the `executor` for more
 *   details).
 * - `executor`: an asynchronous function or saga that executes the job for a
 *   single UAV (e.g., uploads a drone show specification to a single UAV). This
 *   function runs in the context of a worker saga, which is blocked until the
 *   promise returned from the executor resolves or rejects. The function will
 *   be called with an object having three keys: `uavId` is the ID of the UAV
 *   that is targeted by the job, `payload` is the payload of the original job
 *   specification, and `data` is the state slice that was extracted by the
 *   selector associated to the job type. The semantics of the payload and the
 *   data object depends solely on the type of the job being executed.
 *
 * It is recommended to use an executor _saga_ or to make the executor return a
 * _cancellable_ promise to facilitate the cancellation of uploads.
 *
 * Additionally, each entry may contain:
 *
 * - `workerManager`: a saga that should be responsible for the top-level
 *   scheduling of the tasks in the job, related to the individual UAVs.
 *   The saga takes two parameters: the specification from this map and the
 *   current job (consisting of a type and a payload). The executor defaults
 *   to `forkingWorkerManagementSaga`.
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
