# Task management

## Purpose

Async UAV operations (log downloads, calibrations, tests) outlive the UI components that trigger them. The tasks feature (`src/features/tasks/`) provides a centralized Redux-backed store for operation lifecycle, shared across all UI. Mass multi-UAV operations (`operations.ts`) layer on top of it.

## Two independent layers

1. **Single-task layer** (`src/features/tasks/`) — runs one operation on one UAV, tracks state in Redux. The slice is a flat key-value store with no concept of "mass" or "multi-UAV". Public entry points: `startTask`, `resumeTask`, `clearTask` in `actions/core.ts`.
2. **Mass-operation layer** (`operations.ts`) — fans out single tasks across multiple UAVs, collects outcomes, emits one summary. The mass-op layer consumes the single-task layer; the single-task layer has no knowledge of mass ops.

## Task identity

Tasks are identified by the triple `(type, uavId, taskId)`, combined into a composite key by `getTaskKey()` in `utils.ts`. This key is the Redux state key, the selector lookup key, and the active-operations Map key. There are two task types (`log-download`, `uav-test`) forming a discriminated union (`types.ts`).

## Slice (`slice.ts`)

Reducers are split: **internal actions** (underscore-prefixed, e.g. `_startTask`, `_suspendTask`) are dispatched only by thunks — UI code never calls them. **`clearTasks`** (public) resets everything on server disconnect.

Tasks are **not persisted** (blacklisted from redux-persist). State survives UI teardown within a session, not page reloads.

## Non-Redux mutable state

Two pieces of state are intentionally kept out of the slice:

- **Log content CAS** (`actions/log-download.ts`) — in-memory `Map<hash, FlightLog>`. Only the hash lives in the slice. Logs are large; on reload both the CAS and slice are empty.
- **Active operations Map** (`actions/uav-test.ts`) — module-level `Map` holding `resume` callbacks from the server. These are non-serializable function references; they must never enter Redux state or selectors. Cleaned up in the runner's `finally` or via `clearUAVTestTask`.

## Suspend and resume

Long-running operations (currently compass/accelerometer calibration; the mechanism is general) can be suspended by the server. Suspend currently only applies to `uav-test`.

Flow: server sends progress with `suspended: true` + optional `resume` callback → runner stores callback in the active-operations Map and dispatches `_suspendTask` → **runner promise stays pending** → `resumeTask` invokes the stored callback → same runner continues, eventually resolves/rejects. If the server auto-resumes, the next non-suspended progress message transitions the slice back to `running`. Timeouts are per-spec and reject the runner.

## The `silent` flag

`startTask` accepts `{ silent: true }` (`StartOptions` in `types.ts`). This suppresses per-UAV notifications from the runner. The mass-op layer uses it because it emits its own summary via `runMassOperation`. The flag is baked into the retry closure — retries from a silent op stay silent. Both runners accept the flag; currently only log-download emits notifications.

## Two mass-operation backends

Both share confirmation and notification via `runMassOperation` in `utils/messaging.ts`, but differ in execution:

| | MessageHub backend | Task backend |
|---|---|---|
| Entry | `performMassOperation` (`messaging.ts`) | `makeMultiUAVAction` (`operations.ts`) |
| Execution | Calls `messageHub.startAsyncOperation` directly | Fans out `startTask` per UAV |
| Per-UAV Redux state | None | Each UAV gets a slice entry |
| Broadcast | Yes | No (by design) |
| UI wiring | `createUAVOperationThunks` | `createTaskOperationThunks` |

**Why two**: Not all ops need per-UAV tracking. The messageHub backend is simpler. The task backend exists when per-UAV status should be visible in other UI (e.g., compass calibration started from the toolbar shows in the Tests panel, and vice versa).

**Why no broadcast on the task path**: The backend always uses `getSelectedUAVIds`. Broadcasting a tracked per-UAV operation across all UAVs would be a UX mistake. The targeting decision is made at UI wiring time.

**Shared flow** (`runMassOperation`): confirmation dialog → backend `run` returns `Outcomes` map (`uavId → 'success' | 'failure' | 'skipped'`) → single summary via `notifyFromResults`.

**Task backend flow**: dispatch `startTask(spec, { silent: true })` per UAV → `undefined` means already running (skip) → `Promise.allSettled` → read final status from slice via `getTaskState` (`selectors.ts`) → map to outcomes.

## Extension points

- **New single-task type**: extend types in `types.ts`, add runner in `actions/`, wire into `startTask`/`resumeTask`/`clearTask` in `actions/core.ts`.
- **New task-based mass operation**: add spec to `TASK_SPECS` in `operations.ts`, add thunk in `createTaskOperationThunks`, wire button with `createAggregatedTaskStateSelector` (`selectors.ts`) for status display.
- **Migrate messageHub op → tasks**: remove from `OPERATION_MAP` in `messaging.ts`, follow the new mass-op steps above. Button wiring switches to `createTaskOperationThunks`.

## Deliberate gaps

- No cancellation (active-operations Map can be extended with cancel tokens later).
- No persistence (tasks are ephemeral session state).
