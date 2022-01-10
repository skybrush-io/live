/**
 * Mapping from known job types to the async functions that handle them.
 *
 * Each entry in this map consists of:
 *
 * - `type`: the type of the job, i.e. a unique string identifier
 * - `title`: the title of the job, used in dialog boxes
 * - `selector`: a Redux selector that is called before executing the job for a
 *   single UAV. The selector is called with the Redux state and the ID of the
 *   UAV that the job is targeting, and it can return an arbitrary object that
 *   will be forwarded to the executor (see below in the `executor` for more
 *   details).
 * - `executor`: an asynchronous function that executes the job for a single
 *   UAV (e.g., uploads a drone show specification to a single UAV). This
 *   function runs in the context of a worker saga, which is blocked until the
 *   promise returned from the executor resolves or rejects. The function will
 *   be called with an object having three keys: `uavId` is the ID of the UAV
 *   that is targeted by the job, `payload` is the payload of the original job
 *   specification, and `data` is the state slice that was extracted by the
 *   selector associated to the job type. The semantics of the payload and the
 *   data object depends solely on the type of the job being executed.
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
const JOB_TYPE_TO_SPEC_MAP = {};

/**
 * Returns the job specification object corresponding to the given job type,
 * or null if there is no such job type.
 */
export function getJobSpecificationFromType(type) {
  return JOB_TYPE_TO_SPEC_MAP[type] || null;
}

/**
 * Returns the title to show for jobs of a given type in dialog boxes.
 */
export function getDialogTitleForJobType(type) {
  return getJobSpecificationFromType(type)?.title ?? 'Upload data';
}

/**
 * Registers a new job type specification.
 *
 * See the documentation of `JOB_TYPE_TO_SPEC_MAP` for more information about
 * the specification.
 */
export function registerUploadJobType(spec) {
  const type = spec?.type;

  if (typeof type !== 'string' || type.length === 0) {
    throw new Error('Job specification does not have a type');
  }

  if (JOB_TYPE_TO_SPEC_MAP[type]) {
    throw new Error(`Upload job type ${type} is already registered`);
  }

  if (!spec.executor) {
    throw new Error('Job specification does not have an executor');
  }

  JOB_TYPE_TO_SPEC_MAP[type] = spec;
}
