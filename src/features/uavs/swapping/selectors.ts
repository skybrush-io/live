import { createSelector } from '@reduxjs/toolkit';

import { getMissionMapping } from '~/features/mission/selectors';
import { isShowAuthorizedToStart } from '~/features/show/selectors';
import { getUAVIdList } from '~/features/uavs/selectors';
import { isUploadInProgress } from '~/features/upload/selectors';
import type { AppSelector } from '~/store/reducers';
import type { Identifier } from '~/utils/collections';
import type { Nullable } from '~/utils/types';

import type {
  DroneRef,
  DroneRefPairWithId,
  PartiallyResolvedDronePair,
  ResolvedDrone,
  SwapFieldSide,
} from './types';
import {
  buildSwapPreview,
  getSwapPairProblem,
  parseDroneRef,
  resolveDroneRef,
  simulateSwapBatch,
  type SwapBatchResult,
  type SwapPreviewState,
} from './utils';

type SwapDroneRefs = Record<SwapFieldSide, DroneRef | null>;
type ResolvedSwapDrones = Record<SwapFieldSide, ResolvedDrone | null>;

const NO_RESOLVED_SWAP_DRONES: ResolvedSwapDrones = Object.freeze({
  left: null,
  right: null,
});

const resolveSwapDrones = (
  refs: SwapDroneRefs,
  uavIds: readonly Identifier[],
  mapping: ReadonlyArray<Nullable<Identifier>>
): ResolvedSwapDrones => ({
  left: refs.left && resolveDroneRef(refs.left, uavIds, mapping),
  right: refs.right && resolveDroneRef(refs.right, uavIds, mapping),
});

export const isSwapDronesDialogOpen: AppSelector<boolean> = (state) =>
  state.dialogs.swapDrones.open;

/**
 * Returns whether the mission mapping may be modified by swapping drones.
 */
export const isSwappingAllowed: AppSelector<boolean> = (state) =>
  !isShowAuthorizedToStart(state) && !isUploadInProgress(state);

export const shouldOpenUploadDialogAfterSwap: AppSelector<boolean> = (state) =>
  state.dialogs.swapDrones.openUploadDialogAfterSwap;

export const getSwapDroneFieldTexts: AppSelector<
  Record<SwapFieldSide, string>
> = (state) => state.dialogs.swapDrones.fields;

export const getSwapQueue: AppSelector<DroneRefPairWithId[]> = (state) =>
  state.dialogs.swapDrones.queue;

/**
 * Returns the drone references that the texts in the drone fields parse into.
 */
export const getSwapDroneFieldRefs: AppSelector<SwapDroneRefs> = createSelector(
  getSwapDroneFieldTexts,
  getUAVIdList,
  (fields, uavIds) => ({
    left: parseDroneRef(fields.left, uavIds),
    right: parseDroneRef(fields.right, uavIds),
  })
);

/**
 * Returns the result of executing the queued swaps on the current mapping.
 */
export const getSwapQueueSimulation: AppSelector<SwapBatchResult> =
  createSelector(
    getMissionMapping,
    getUAVIdList,
    getSwapQueue,
    simulateSwapBatch
  );

/**
 * Returns the drones of the queued swaps, resolved in the mapping that results
 * from the swaps preceding them. Swaps after a failed one are missing.
 */
export const getResolvedSwapQueue: AppSelector<PartiallyResolvedDronePair[]> = (
  state
) => getSwapQueueSimulation(state).resolvedPairs;

/**
 * Returns the index of the first queued swap that cannot be executed, or `null`
 * if all of them can be executed.
 */
export const getFailedSwapQueueIndex: AppSelector<number | null> = (state) => {
  const simulation = getSwapQueueSimulation(state);
  return simulation.ok ? null : simulation.failedIndex;
};

/**
 * Returns the drones that the texts in the drone fields resolve to in the current
 * mapping, i.e. when swapping them immediately.
 */
export const getResolvedSwapDronesNow: AppSelector<ResolvedSwapDrones> =
  createSelector(
    getSwapDroneFieldRefs,
    getUAVIdList,
    getMissionMapping,
    resolveSwapDrones
  );

/**
 * Returns the drones that the texts in the drone fields resolve to in the mapping
 * that results from executing the queued swaps, i.e. when adding them to the
 * queue.
 */
export const getResolvedSwapDronesAfterQueue: AppSelector<ResolvedSwapDrones> =
  createSelector(
    getSwapDroneFieldRefs,
    getUAVIdList,
    getSwapQueueSimulation,
    (refs, uavIds, simulation) =>
      simulation.ok
        ? resolveSwapDrones(refs, uavIds, simulation.mapping)
        : NO_RESOLVED_SWAP_DRONES
  );

/**
 * Returns the preview of swapping the drones in the fields immediately.
 */
export const getSwapPreview: AppSelector<SwapPreviewState> = createSelector(
  getResolvedSwapDronesNow,
  isSwappingAllowed,
  ({ left, right }, allowed) => buildSwapPreview(left, right, !allowed)
);

/**
 * Returns whether the drones in the fields can be swapped immediately, in the
 * current mapping. The queue is ignored, only the contents of the fields matter.
 */
export const canSwapCurrentPairNow: AppSelector<boolean> = (state) =>
  getSwapPreview(state).kind === 'ready';

/**
 * Returns whether the drones in the fields can be added to the queue, i.e. they
 * form a valid pair in the mapping that results from the queued swaps. This is
 * different from `canSwapCurrentPairNow()` because it considers the list of entries
 * in the queue.
 */
export const canAddCurrentSwapPairToQueue: AppSelector<boolean> = (state) => {
  const { left, right } = getResolvedSwapDronesAfterQueue(state);
  return (
    isSwappingAllowed(state) &&
    left !== null &&
    right !== null &&
    getSwapPairProblem(left, right) === null
  );
};

/**
 * Returns whether the queue is non-empty and all of its swaps can be executed,
 * in order, on the current mapping.
 */
export const canExecuteSwapQueue: AppSelector<boolean> = (state) =>
  isSwappingAllowed(state) &&
  getSwapQueue(state).length > 0 &&
  getSwapQueueSimulation(state).ok;

/**
 * Returns the i18n key of the warning to show in the swap drones dialog, or
 * `null` if there is nothing to warn about. Problems of the pair in the fields
 * take precedence over a stale queue.
 */
export const getSwapWarningMessageKey: AppSelector<string | null> = (state) => {
  const preview = getSwapPreview(state);
  if (preview.kind === 'blocked' || preview.kind === 'warning') {
    return preview.messageKey;
  }

  if (!getSwapQueueSimulation(state).ok) {
    return 'swapDronesDialog.queue.stalePairs';
  }

  return null;
};
