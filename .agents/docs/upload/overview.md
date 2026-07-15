# Upload jobs

## Purpose

`src/features/upload/` coordinates long-running, fan-out UAV operations: show, parameter, firmware, and mission-item uploads all share bounded scheduling, per-UAV state, retry, cancellation, and history. “Upload” is a historical name retained for compatibility. Use `features/tasks` for independently tracked single-UAV work; use upload jobs when one coordinated run owns multiple UAV executions.

## Architecture

A domain feature opens a `{ type, payload }` job; `actions.ts` resolves targets and starts it. `saga.ts` looks up the type in the registry from `jobs.ts`, then delegates job-wide execution to its worker manager. Domain code owns target-specific data and one-UAV work; the upload feature owns shared scheduling and lifecycle state. Built-ins are registered at startup in `src/upload-jobs.js`.

The default `forkingWorkerManagementSaga` feeds a configured number of workers from a one-item channel. Its Redux queues in `slice.ts` are the visible lifecycle:

`waiting → queued → in progress → finished | failed`

`queued` and `in progress` items cannot be edited by the user. On completion, the slice commits a `HistoryItem` with the job status and per-UAV result pieces, then compacts per-job history; selectors layer active queues over that history. Only upload settings persist in `src/store/index.js`: jobs, queues, history, and per-UAV results are session-only.

## Job specification

`JobSpecification<Payload, Data, ResultPiece>` in `jobs.ts` is the boundary between a job type and the generic engine:

- **Payload** is job-defined shared input. **Selector** is an optional per-UAV demultiplexer evaluated immediately before execution.
- **Executor** runs exactly one UAV and resolves to a `ResultPiece`; it can report progress through the supplied callback.
- **Scope** defines candidate targets (all, compatible, mission, or selected UAV); target selection and global-selection restriction remain the framework’s responsibility.
- **Worker manager** is a supported alternative scheduling policy. It must return a `HistoryItem<ResultPiece>`; the default is the normal choice.
- **Post-action** is an optional `() => AppThunk` dispatched after the history item is committed, so it can read the per-UAV results from Redux.

The show job demonstrates per-UAV selection and mission scope; firmware uses compatible scope. Parameter and mission-item jobs show that payload shaping remains domain-specific. The parameter consistency check demonstrates the post-action pattern: it reads per-UAV results from the committed history item instead of receiving an aggregated result.

## Outcomes, results, and retries

A single-UAV execution outcome is success, retryable failure, permanent failure, or cancellation (internal to `saga.ts`). Selector failures are permanent, preventing retry loops; executor rejections are retryable. Automatic retry only re-enqueues retryable failures from this run, never historical failures.

The default manager records every worker outcome into a `perUAVResults` map in `HistoryItem` form: successful pieces carry the executor result, failures carry the error message, and cancellations are omitted. This history item is committed to Redux by `_notifyUploadFinished` in `slice.ts` and is the canonical source for job results. Domain code can read it with selectors such as `aggregatePerUAVResultsFromHistory` in `utils.ts`.

Progress enters a one-item saga channel, deliberately dropping stale intermediate reports. Completion forces progress to 100% for time estimation.

## Invariants and gaps

Only one job runs at once; `setupNextUploadJob` cannot replace it. `cancelUpload` races the manager and cancellation is cooperative: executors must be cancellation-aware sagas or return cancellable promises. Waiting UAVs remain retryable after cancellation; other code may explicitly remove them.

Do not dispatch underscore-prefixed lifecycle actions outside `saga.ts`, mutate `queued`/`in progress` entries, or register duplicate job types. `postAction` must read results from the committed history item, not from arguments. There is no reload recovery or forced cancellation for non-cooperative executors.

## Extending

Add a stable, domain-owned specification to `src/upload-jobs.js`; provide scope, executor, and the selector or post-action the job needs. Prefer the default manager. A custom manager is appropriate for a genuinely different scheduling policy, but must preserve the slice lifecycle and return a `HistoryItem<ResultPiece>`.
