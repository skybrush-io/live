import { adjustMissionMapping } from '~/features/mission/actions';
import {
  getMissionMapping,
  getReverseMissionMapping,
} from '~/features/mission/selectors';
import { SHOW_UPLOAD_JOB } from '~/features/show/constants';
import { showSuccess } from '~/features/snackbar/actions';
import {
  openUploadDialogForJob,
  putUavsInWaitingQueue,
} from '~/features/upload/slice';
import i18n from '~/i18n';
import type { AppThunk } from '~/store/reducers';

import {
  canAddCurrentSwapPairToQueue,
  canExecuteSwapBatch,
  getResolvedSwapDrones,
  getSwapBatchValidation,
  getSwapQueue,
  shouldOpenUploadDialogAfterSwap,
} from './selectors';
import {
  addPairToSwapQueue,
  clearSwapQueue,
  closeSwapDronesDialog,
} from './slice';
import type { ResolvedDronePair } from './types';
import {
  buildSwapApplyPairs,
  getSwapAdjustMissionMappingArgs,
  getSwapPairAffectedUavIds,
} from './utils';

export type ApplySwapDronesBatchOptions = {
  openUploadAfterSwap?: boolean;
};

export const applySwapDronesBatch =
  (
    pairs: ResolvedDronePair[],
    { openUploadAfterSwap = false }: ApplySwapDronesBatchOptions = {}
  ): AppThunk =>
  (dispatch, getState) => {
    const affectedUavIds = new Set<string>();

    for (const pair of pairs) {
      const state = getState();
      const reverseMapping = getReverseMissionMapping(state);
      const mapping = getMissionMapping(state);

      for (const uavId of getSwapPairAffectedUavIds(
        pair,
        mapping,
        reverseMapping
      )) {
        affectedUavIds.add(uavId);
      }

      const args = getSwapAdjustMissionMappingArgs(pair, reverseMapping);
      if (!args) {
        continue;
      }

      dispatch(adjustMissionMapping(args));
    }

    if (openUploadAfterSwap && affectedUavIds.size > 0) {
      const mapping = getMissionMapping(getState());
      const uploadTargets = [...affectedUavIds].filter((uavId) =>
        mapping.includes(uavId)
      );

      if (uploadTargets.length > 0) {
        dispatch(openUploadDialogForJob({ job: SHOW_UPLOAD_JOB }));
        dispatch(putUavsInWaitingQueue(uploadTargets));
      }
    }
  };

/**
 * Adds the pair of drones currently entered into the fields of the swap drones
 * dialog to the swap queue.
 */
export const addCurrentPairToSwapQueue =
  (): AppThunk => (dispatch, getState) => {
    const state = getState();
    const { left: drone1, right: drone2 } = getResolvedSwapDrones(state);
    if (!canAddCurrentSwapPairToQueue(state) || !drone1 || !drone2) {
      return;
    }

    dispatch(addPairToSwapQueue({ drone1, drone2 }));
  };

/**
 * Executes the queued swaps, along with the pair of drones currently entered into
 * the fields of the swap drones dialog, then closes the dialog.
 */
export const executeSwapBatch = (): AppThunk => (dispatch, getState) => {
  const state = getState();
  const batchValidation = getSwapBatchValidation(state);
  if (!canExecuteSwapBatch(state) || !batchValidation.valid) {
    return;
  }

  const { left: drone1, right: drone2 } = getResolvedSwapDrones(state);
  const pairs = buildSwapApplyPairs(
    getSwapQueue(state),
    batchValidation.applyCurrentPair,
    drone1,
    drone2
  );

  dispatch(
    applySwapDronesBatch(pairs, {
      openUploadAfterSwap: shouldOpenUploadDialogAfterSwap(state),
    })
  );
  dispatch(clearSwapQueue());
  showSuccess(i18n.t('swapDronesDialog.success'));
  dispatch(closeSwapDronesDialog());
};
