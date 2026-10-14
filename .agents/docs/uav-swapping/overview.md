# Drone swapping

## Purpose

Operators replace drones in the field (low battery, hardware fault, spare on standby) without rebuilding the mission mapping by hand. `src/features/uavs/swapping/` edits the mission mapping (`mission.mapping`, slot index → UAV ID) through a dialog opened from `SwapDronesToolbarButton` in the UAV toolbar. The feature only edits the mapping; it never talks to the drones, and the new show still has to be uploaded to the affected drones afterwards.

## Swap semantics

A swap takes two resolved drones (`ResolvedDrone`: UAV ID + mission index or `null` if unmapped). `simulateSwapBatch` in `utils.ts` applies it through `moveUAVInMapping` (`features/mission/utils.ts`):

- **Both mapped**: the drones exchange slots.
- **One mapped**: the unmapped (spare) drone takes the slot; the mapped drone leaves the mapping.
- **Both unmapped** or **same drone**: invalid (`getSwapPairProblem` returns the i18n key of the reason).

Field order matters only for coloring, not for the result.

## Drone references

Users type references, not drones. `DroneRef` (`types.ts`) is either:

- `{ kind: 'uav', uavId }` — sticks to the physical drone; its slot is looked up at resolution time.
- `{ kind: 'slot', missionIndex }` — typed as a show ID (`sN`, 1-based, parsed by `parseMissionId` in `utils/formatting.ts`); resolves to whichever drone occupies that slot at resolution time.

`parseDroneRef` tries the show ID first, so a UAV whose ID looks like `sN` cannot be referenced by ID. A UAV ref must match a known UAV ID (`getUAVIdList`) case-insensitively; the canonical ID is stored. `resolveDroneRef` returns `null` for an unknown UAV, an empty slot, or a slot held by a UAV not in `getUAVIdList`.

The text fields store **raw strings** in the slice (`fields`), not refs; `getSwapDroneFieldRefs` parses them, so a field becomes valid as soon as the matching UAV appears. Selecting from the `UAVSelector` popup writes `sN` if the typed text starts with `s`, the UAV ID otherwise (`swapSelectionLabel`).

## Two execution modes

| | Swap now | Queue |
|---|---|---|
| Entry | `swapCurrentPairNow` | `addCurrentPairToSwapQueue` → `executeSwapQueue` |
| Resolved against | Current mapping | Mapping after all preceding queued swaps |
| Queue afterwards | Kept | Cleared |
| Dialog afterwards | Closed | Closed |

Queued pairs keep **unresolved refs** (`DroneRefPairWithId`, `nanoid` ID for React keys and removal). Each one is re-resolved during simulation against the mapping produced by its predecessors, so `s3 ↔ 17` followed by `s3 ↔ 20` swaps 20 with drone 17 (now in `s3`). That is why refs, not resolved drones, are queued.

The add check (`canAddCurrentSwapPairToQueue`) validates the field pair against the **post-queue** mapping (`getResolvedSwapDronesAfterQueue`); swap-now validates against the **current** mapping (`getSwapPreview`) and ignores the queue.

## Atomic execution

`executeSwaps` (private, `actions.ts`) re-simulates the whole batch on the latest state, then dispatches a **single** `updateMapping` (`features/mission/actions/ts-actions.ts`). `updateMapping` refuses length changes and dispatches `notifyUAVsInMissionMappingChanged` only for UAVs whose index changed (`getUAVsWithChangedMissionIndex`). If any swap fails, nothing changes and an error snackbar appears. Never apply swaps one by one through `adjustMissionMapping`; the intermediate notifications and partial failure are exactly what the batch avoids.

## Stale queue

The mapping can change under a queue (manual edits, another swap now, UAVs disappearing). `getSwapQueueSimulation` (memoized on mapping, UAV list, queue) reports `failedIndex` of the first swap that fails; later swaps are not evaluated (`resolvedPairs` is shorter, so `resolvedQueue[index]` may be `undefined`). While stale: the failed row is outlined, adding and executing are disabled, and `swapDronesDialog.queue.stalePairs` is shown. The user must remove the row; there is no automatic repair.

## Gating

`isSwappingAllowed`: false while the show is authorized to start or an upload is in progress. When false the preview is `blocked` and all swap/add/execute actions are disabled. The thunks re-check their `can*` selector before acting, so UI disabling is not the only guard.

## Upload after swap

With `openUploadDialogAfterSwap` on, the targets are the UAVs whose index changed **and that are still in the mapping** (removed drones need no show). `openUploadDialogForJob({ job: SHOW_UPLOAD_JOB })` is dispatched **before** `putUavsInWaitingQueue`, since opening for a different job type clears the upload queues. Nothing opens if no target remains.

## State (`slice.ts`)

Stored at `state.dialogs.swapDrones`: `open`, `fields`, `openUploadDialogAfterSwap`, `queue`. Not persisted (not in the `dialogs` filter in `src/store/index.js`). `showSwapDronesDialog` resets the fields but keeps the queue; `addPairToSwapQueue` clears the fields. The reducers do not validate; the thunks in `actions.ts` do.

## Preview and UI

- `buildSwapPreview` turns the resolved field pair into `SwapPreviewState` (`blocked | placeholder | warning | ready`). `ready` lines are i18n keys with `<name/>` placeholders that `SwapDronesPreview` fills with `SwapDroneBadge` chips via `<Trans components>`. A new placeholder needs a matching key in `badges` and in `en.json`.
- `getSwapWarningMessageKey` shows a single alert: field-pair problems (`blocked`/`warning`) win over a stale queue, and any warning hides the preview.
- Left field = `warning.main`, right = `success.main` (`FIELD_COLORS`); badges inherit the color of the field their drone came from (`fieldBadgeColor`), slot badges are uncolored.
- `DroneRefLabel` renders queue entries as `uavId/sN` and dims the inferred half (the part the user did not type).
- Layout constants in `constants.ts` reserve space so that the dialog does not resize while typing or as the queue grows.

## Extending

- New validation rule: add it to `getSwapPairProblem` (applies to swap now, add, and simulation alike) with an i18n key under `swapDronesDialog.preview`.
- New ref syntax: extend `DroneRef`, `parseDroneRef`, `resolveDroneRef`, `formatDroneRef`, and `DroneRefLabel`.
- Keep all mapping writes in `executeSwaps` → `updateMapping`; keep derived state in selectors and store only raw input in the slice.
