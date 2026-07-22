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
- **Worker manager** is a supported alternative scheduling policy. It resolves to a terminal `UAVStatus` (`'success'` or `'error'`) and records each single-UAV outcome through a `recordResult` callback (`RecordUAVResultCallback` in `jobs.ts`) supplied by the upload saga; the default is the normal choice. It never returns `'cancelled'` — that status is set by the upload saga when it observes `cancelUpload`.
- **Post-action** is an optional `() => AppThunk` dispatched after the history item is committed, so it can read the per-UAV results from Redux.

The show job demonstrates per-UAV selection and mission scope; firmware uses compatible scope. Parameter and mission-item jobs show that payload shaping remains domain-specific. The parameter consistency check demonstrates the post-action pattern: it reads per-UAV results from the committed history item instead of receiving an aggregated result.

## Outcomes, results, and retries

A single-UAV execution outcome is success, retryable failure, permanent failure, or cancellation (internal to `saga.ts`). Selector failures are permanent, preventing retry loops; executor rejections are retryable. Automatic retry only re-enqueues retryable failures from this run, never historical failures.

The default manager records every worker outcome through `recordResult` as it arrives into a per-UAV map owned by `uploaderSagaWithCancellation`: successes carry the executor result piece, failures the error message, cancellations are omitted. The outer saga builds the `HistoryItem` from this map plus the manager's terminal `UAVStatus` and commits it via `_notifyUploadFinished` in `slice.ts` — regardless of how the run ended, which is why partial results persist on cancellation. The committed item is the canonical source for job results; domain code reads it with selectors such as `aggregatePerUAVResultsFromHistory` in `utils.ts`, and it is the single input for per-job-type result panels and post-actions.

Progress enters a one-item saga channel, deliberately dropping stale intermediate reports. Completion forces progress to 100% for time estimation.

## Invariants and gaps

Only one job runs at once; `setupNextUploadJob` cannot replace it. `cancelUpload` races the manager and cancellation is cooperative: executors must be cancellation-aware sagas or return cancellable promises. Waiting UAVs remain retryable after cancellation; other code may explicitly remove them.

Do not dispatch underscore-prefixed lifecycle actions outside `saga.ts`, mutate `queued`/`in progress` entries, or register duplicate job types. `postAction` must read results from the committed history item, not from arguments. There is no reload recovery or forced cancellation for non-cooperative executors.

## Extending

Add a stable, domain-owned specification to `src/upload-jobs.js`; provide scope, executor, and the selector or post-action the job needs. Prefer the default manager. A custom manager is for a genuinely different scheduling policy and must preserve the slice lifecycle, call `recordResult` for each UAV as it finishes, and resolve to a terminal `UAVStatus`. Optionally register a result-panel component via `registerUploadJobResultPanel` in `result-panels.ts` (wired in `src/upload-jobs.js` alongside the spec); when one is registered, the upload dialog shows a `status`/`results` tab bar and renders the panel, which reads the committed history item through its own selectors, not from props.
