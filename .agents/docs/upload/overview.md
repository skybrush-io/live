# Upload jobs

## Purpose

`src/features/upload/` coordinates long-running, fan-out UAV operations: show, parameter, firmware, and mission-item uploads all share bounded scheduling, per-UAV state, retry, cancellation, and history. “Upload” is a historical name retained for compatibility. Use `features/tasks` for independently tracked single-UAV work; use upload jobs when one coordinated run owns multiple UAV executions.

## Architecture

A domain feature opens a `{ type, payload }` job; `actions.ts` resolves targets and starts it. `saga.ts` looks up the type in the registry from `jobs.ts`, then delegates job-wide execution to its worker manager. Domain code owns target-specific data and one-UAV work; the upload feature owns shared scheduling and lifecycle state. Built-ins are registered at startup in `src/upload-jobs.js`.

The default `forkingWorkerManagementSaga` feeds a configured number of workers from a one-item channel. Its Redux queues in `slice.ts` are the visible lifecycle:

`waiting → queued → in progress → finished | failed`

`queued` and `in progress` items cannot be edited by the user. On completion, the slice compacts per-job, per-UAV status and error history; selectors layer active queues over that history. Only upload settings persist in `src/store/index.js`: jobs, queues, history, and results are session-only.

## Job specification

`JobSpecification<T, ResultPiece, Result>` in `jobs.ts` is the boundary between a job type and the generic engine:

- **Payload** is job-defined shared input. **Selector** is an optional per-UAV demultiplexer evaluated immediately before execution.
- **Executor** runs exactly one UAV and resolves to a `ResultPiece`; it can report progress through the supplied callback.
- **Scope** defines candidate targets (all, compatible, mission, or selected UAV); target selection and global-selection restriction remain the framework’s responsibility.
- **Result aggregation** optionally creates one result, merges successful pieces, and finalizes it after normal manager completion.
- **Worker manager** is a supported alternative scheduling policy. It must return an `Outcome`; the default is the normal choice.

The show job demonstrates per-UAV selection and mission scope; firmware uses compatible scope. Parameter and mission-item jobs show that payload shaping remains domain-specific.

## Outcomes, results, and retries

An execution outcome is success, retryable failure, permanent failure, or cancellation (`types.ts`). Selector failures and aggregation-update exceptions are permanent, preventing retry loops; executor rejections are retryable. Automatic retry only re-enqueues retryable failures from this run, never historical failures.

The default manager calls `result.create()` once, passes successful pieces to `update()` in worker-completion order, then calls `finalize()` after all workers have stopped. A non-`undefined` result returned by either hook replaces the current aggregate; `undefined` preserves it, allowing in-place mutation. Finalization also runs after a normally completed failed run, but only a successful `Outcome` carries the aggregate. Results are neither Redux state nor persisted; `uploaderSagaWithCancellation` currently only logs a successful one.

Progress enters a one-item saga channel, deliberately dropping stale intermediate reports. Completion forces progress to 100% for time estimation.

## Invariants and gaps

Only one job runs at once; `setupNextUploadJob` cannot replace it. `cancelUpload` races the manager and cancellation is cooperative: executors must be cancellation-aware sagas or return cancellable promises. Top-level cancellation prevents normal finalization. Waiting UAVs remain retryable after cancellation; other code may explicitly remove them.

Do not dispatch underscore-prefixed lifecycle actions outside `saga.ts`, mutate `queued`/`in progress` entries, or register duplicate job types. There is no reload recovery, forced cancellation for non-cooperative executors, or consumer for aggregate results beyond logging.

## Extending

Add a stable, domain-owned specification to `src/upload-jobs.js`; provide scope, executor, and only the selector or result hooks the job needs. Prefer the default manager. A custom manager is appropriate for a genuinely different scheduling policy, but must preserve the slice lifecycle and return the correct `Outcome`.
