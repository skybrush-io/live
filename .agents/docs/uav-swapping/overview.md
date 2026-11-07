# Drone swapping

## Purpose

Operators replace drones in the field (low battery, hardware fault, spare on standby) without rebuilding the mission mapping by hand. `src/features/uavs/swapping/` edits the mission mapping (`mission.mapping`, slot index → UAV ID) through a dialog opened from `SwapDronesToolbarButton` in the UAV toolbar. The feature only edits the mapping; it never talks to the drones, and the new show still has to be uploaded to the affected drones afterwards.

## Swap semantics

A swap takes two endpoints (`SwapEndpoint`): a drone (UAV ID + mission index, `null` if unmapped) or an empty slot (`uavId: null` + mission index). Drones do not have to be online: operators prepare swaps before the ground crew turns the drones on. `simulateSwapBatch` in `utils.ts` puts the content of each endpoint (drone or emptiness) into the slot of the other one:

- **Both drones mapped**: the drones exchange slots.
- **Mapped drone + unmapped drone**: the unmapped (spare) drone takes the slot; the mapped drone leaves the mapping.
- **Mapped drone + empty slot**: the drone moves to the empty slot; its old slot becomes empty.
- **Unmapped drone + empty slot**: the drone fills the slot.
- **Same drone**, **same slot**, **both unmapped** or **both empty**: invalid (`getSwapPairProblem` returns the i18n key of the reason).

Field order matters only for coloring, not for the result.

## Drone references

Users type references, not drones. `DroneRef` (`types.ts`) is either:

- `{ kind: 'uav', uavId }` — sticks to the physical drone; its slot is looked up at resolution time.
- `{ kind: 'slot', missionIndex }` — typed as a show ID (`sN`, 1-based, parsed by `parseMissionId` in `utils/formatting.ts`); resolves to whichever drone occupies that slot at resolution time, or to the empty slot.

`parseDroneRef` tries the show ID first, so a UAV whose ID looks like `sN` cannot be referenced by ID; incomplete or invalid show IDs (`s`, `s0`, `looksLikeShowId`) parse into nothing. Any other text is a UAV ref: if it matches the ID of an online or mapped drone case-insensitively, the canonical ID is stored, otherwise the text as typed. `resolveDroneRef` does not look at the online drones; it returns `null` only for a slot beyond the end of the mapping.

The text fields store **raw strings** in the slice (`fields`), not refs; `getSwapDroneFieldRefs` parses them, so the canonical ID follows the drones known at the time. While a show ID is being typed, the `UAVSelector` popup lists the slots of the mapping (`useMissionIds`), including empty ones. Selecting from the `UAVSelector` popup writes `sN` if the typed text looks like a partial show ID (`s` followed by digits only), the UAV ID otherwise (`getLabelForSelection` in `SwapDroneField.tsx`).

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

The mapping can change under a queue (manual edits, another swap now, mapping length changes). Drones going offline do not affect the queue. `getSwapQueueSimulation` (memoized on mapping and queue) reports `failedIndex` of the first swap that fails; later swaps are not evaluated (`resolvedPairs` is shorter, so `resolvedQueue[index]` may be `undefined`). While stale: the failed row is outlined, adding and executing are disabled, and `swapDronesDialog.queue.stalePairs` is shown. The user must remove the row; there is no automatic repair.

## Gating

`isSwappingAllowed`: false while the show is authorized to start, an upload is in progress or the mapping is being calculated (`isMappingBeingCalculated`). When false the preview is `blocked` and all swap/add/execute actions are disabled. The thunks re-check their `can*` selector before acting, so UI disabling is not the only guard.

## Upload after swap

With `openUploadDialogAfterSwap` on, the targets are the UAVs whose index changed **and that are still in the mapping** (removed drones need no show), including drones that are not online: the upload fails or retries for them, so the operator notices. `openUploadDialogForJob({ job: SHOW_UPLOAD_JOB })` is dispatched **before** `putUavsInWaitingQueue`, since opening for a different job type clears the upload queues. Nothing opens if no target remains. With `openUploadDialogAfterSwap` off and targets remaining, the notification is a warning (`successUploadNeeded`) that lists them instead of a success.

## State (`slice.ts`)

Stored at `state.dialogs.swapDrones`: `open`, `fields`, `openUploadDialogAfterSwap`, `queue`. Not persisted (not in the `dialogs` filter in `src/store/index.js`). `showSwapDronesDialog` resets the fields but keeps the queue; `addPairToSwapQueue` clears the fields. The reducers do not validate; the thunks in `actions.ts` do.

## Preview and UI

- `buildSwapPreview` turns the resolved field pair into `SwapPreviewState` (`blocked | placeholder | warning | ready`). `ready` lines are i18n keys with `<name/>` placeholders that `SwapDronesPreview` fills with `SwapDroneBadge` chips via `<Trans components>`. A new placeholder needs a matching key in `badges` and in `en.json`.
- `getSwapWarningMessageKey` shows a single alert: field-pair problems (`blocked`/`warning`) win over a stale queue, and any warning hides the preview.
- Left field = `warning.main`, right = `success.main` (`FIELD_COLORS`); badges inherit the color of the field their drone came from, slot badges are uncolored. Badges of drones that are not online are dimmed, and a `notOnline` line lists them.
- `DroneRefLabel` renders queue entries as `uavId/sN` and dims the inferred half (the part the user did not type).
- Keyboard flow: Enter or a selection in the left field focuses the right field; in the right field it focuses the Swap button (deferred, so the button is enabled by then and the same Enter does not press it). `SwapDroneField` reports both through `onSubmit`. Escape in a field closes the dialog through `onCancel`: the `UAVSelector` popup is a modal on top of the dialog, and MUI dialogs ignore Escape unless they are the topmost modal.
- Layout constants in `constants.ts` reserve space so that the dialog does not resize while typing or as the queue grows.

## Extending

- New validation rule: add it to `getSwapPairProblem` (applies to swap now, add, and simulation alike) with an i18n key under `swapDronesDialog.preview`.
- New ref syntax: extend `DroneRef`, `parseDroneRef`, `resolveDroneRef`, `formatDroneRef`, and `DroneRefLabel`.
- Keep all mapping writes in `executeSwaps` → `updateMapping`; keep derived state in selectors and store only raw input in the slice.
