import { createSelector } from '@reduxjs/toolkit';

import {
  getMissionMapping,
  getReverseMissionMapping,
} from '~/features/mission/selectors';
import { isShowAuthorizedToStart } from '~/features/show/selectors';
import { getUAVIdList } from '~/features/uavs/selectors';
import { isUploadInProgress } from '~/features/upload/selectors';
import type { AppSelector } from '~/store/reducers';

import type { ResolvedDrone, ResolvedDronePairWithId } from './types';
import {
  buildSwapPreview,
  currentPairOverlapsQueue,
  resolveSwapDrone,
  validateSwapBatch,
  type SwapBatchValidation,
  type SwapFieldSide,
  type SwapPreviewState,
} from './utils';

export const isSwapDronesDialogOpen: AppSelector<boolean> = (state) =>
  state.dialogs.swapDrones.open;

export const isSwappingAllowed: AppSelector<boolean> = (state) =>
  !isShowAuthorizedToStart(state) && !isUploadInProgress(state);

export const shouldOpenUploadDialogAfterSwap: AppSelector<boolean> = (state) =>
  state.dialogs.swapDrones.openUploadDialogAfterSwap;

export const getSwapDroneFieldTexts: AppSelector<
  Record<SwapFieldSide, string>
> = (state) => state.dialogs.swapDrones.fields;

export const getSwapQueue: AppSelector<ResolvedDronePairWithId[]> = (state) =>
  state.dialogs.swapDrones.queue;

/**
 * Returns the drones that the texts in the drone fields currently resolve to.
 */
export const getResolvedSwapDrones: AppSelector<
  Record<SwapFieldSide, ResolvedDrone | null>
> = createSelector(
  getSwapDroneFieldTexts,
  getUAVIdList,
  getMissionMapping,
  getReverseMissionMapping,
  (fields, uavIds, mapping, reverseMapping) => ({
    left: resolveSwapDrone(fields.left, uavIds, mapping, reverseMapping),
    right: resolveSwapDrone(fields.right, uavIds, mapping, reverseMapping),
  })
);

/**
 * Returns the preview of the swap of the drones currently entered into the fields.
 */
export const getSwapPreview: AppSelector<SwapPreviewState> = createSelector(
  getResolvedSwapDrones,
  isSwappingAllowed,
  ({ left, right }, allowed) => buildSwapPreview(left, right, !allowed)
);

/**
 * Returns whether any of the drones currently entered into the fields is already
 * part of a queued swap.
 */
export const isCurrentSwapPairOverlappingQueue: AppSelector<boolean> =
  createSelector(
    getResolvedSwapDrones,
    getSwapQueue,
    ({ left, right }, queue) => currentPairOverlapsQueue(left, right, queue)
  );

export const getSwapBatchValidation: AppSelector<SwapBatchValidation> =
  createSelector(
    getSwapQueue,
    getResolvedSwapDrones,
    isSwappingAllowed,
    getUAVIdList,
    getReverseMissionMapping,
    (queue, { left, right }, allowed, uavIds, reverseMapping) =>
      validateSwapBatch(queue, left, right, !allowed, uavIds, reverseMapping)
  );

/**
 * Returns the i18n key of the warning to show in the swap drones dialog, or
 * `null` if there is nothing to warn about.
 */
export const getSwapWarningMessageKey: AppSelector<string | null> =
  createSelector(
    getSwapPreview,
    isCurrentSwapPairOverlappingQueue,
    getSwapBatchValidation,
    (preview, overlapsQueue, batchValidation) => {
      if (overlapsQueue && preview.kind === 'ready') {
        return 'swapDronesDialog.queue.overlap';
      }

      if (
        !batchValidation.valid &&
        batchValidation.reason !== 'empty' &&
        batchValidation.reason !== 'blocked'
      ) {
        return batchValidation.messageKey;
      }

      return preview.kind === 'warning' || preview.kind === 'blocked'
        ? preview.messageKey
        : null;
    }
  );

export const canAddCurrentSwapPairToQueue: AppSelector<boolean> = (state) =>
  isSwappingAllowed(state) &&
  getSwapPreview(state).kind === 'ready' &&
  !isCurrentSwapPairOverlappingQueue(state);

export const canExecuteSwapBatch: AppSelector<boolean> = (state) =>
  getSwapBatchValidation(state).valid &&
  getSwapWarningMessageKey(state) === null;
