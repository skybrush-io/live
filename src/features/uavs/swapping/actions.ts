import { updateMapping } from '~/features/mission/actions';
import { getMissionMapping } from '~/features/mission/selectors';
import { getUAVsWithChangedMissionIndex } from '~/features/mission/utils';
import { SHOW_UPLOAD_JOB } from '~/features/show/constants';
import { showError, showSuccess } from '~/features/snackbar/actions';
import { getUAVIdList } from '~/features/uavs/selectors';
import {
  openUploadDialogForJob,
  putUavsInWaitingQueue,
} from '~/features/upload/slice';
import i18n from '~/i18n';
import type { AppThunk } from '~/store/reducers';

import {
  canAddCurrentSwapPairToQueue,
  canExecuteSwapQueue,
  canSwapCurrentPairNow,
  getSwapDroneFieldRefs,
  getSwapQueue,
  shouldOpenUploadDialogAfterSwap,
} from './selectors';
import {
  addPairToSwapQueue,
  clearSwapQueue,
  closeSwapDronesDialog,
} from './slice';
import type { DroneRefPair } from './types';
import { simulateSwapBatch } from './utils';

/**
 * Executes the given swaps, in order, as a single update of the mission mapping.
 * Nothing is changed if any of the swaps cannot be executed in the mapping that
 * results from the swaps preceding it.
 *
 * @returns whether the swaps were executed
 */
const executeSwaps =
  (pairs: readonly DroneRefPair[]): AppThunk<boolean> =>
  (dispatch, getState) => {
    const state = getState();
    const mapping = getMissionMapping(state);
    const result = simulateSwapBatch(mapping, getUAVIdList(state), pairs);
    if (!result.ok) {
      showError(i18n.t('swapDronesDialog.failure'));
      return false;
    }

    dispatch(updateMapping(result.mapping));

    if (shouldOpenUploadDialogAfterSwap(state)) {
      const uploadTargets = getUAVsWithChangedMissionIndex(
        mapping,
        result.mapping
      ).filter((uavId) => result.mapping.includes(uavId));

      if (uploadTargets.length > 0) {
        dispatch(openUploadDialogForJob({ job: SHOW_UPLOAD_JOB }));
        dispatch(putUavsInWaitingQueue(uploadTargets));
      }
    }

    showSuccess(i18n.t('swapDronesDialog.success'));
    return true;
  };

/**
 * Adds the pair of drones in the fields of the swap drones dialog to the swap
 * queue. The references are resolved only when the queue is executed.
 */
export const addCurrentPairToSwapQueue =
  (): AppThunk => (dispatch, getState) => {
    const state = getState();
    const { left: drone1, right: drone2 } = getSwapDroneFieldRefs(state);
    if (!canAddCurrentSwapPairToQueue(state) || !drone1 || !drone2) {
      return;
    }

    dispatch(addPairToSwapQueue({ drone1, drone2 }));
  };

/**
 * Swaps the pair of drones in the fields of the swap drones dialog immediately,
 * resolved in the current mapping, then closes the dialog. The queue is kept.
 */
export const swapCurrentPairNow = (): AppThunk => (dispatch, getState) => {
  const state = getState();
  const { left: drone1, right: drone2 } = getSwapDroneFieldRefs(state);
  if (!canSwapCurrentPairNow(state) || !drone1 || !drone2) {
    return;
  }

  if (dispatch(executeSwaps([{ drone1, drone2 }]))) {
    dispatch(closeSwapDronesDialog());
  }
};

/**
 * Executes the queued swaps, then clears the queue and closes the dialog.
 */
export const executeSwapQueue = (): AppThunk => (dispatch, getState) => {
  const state = getState();
  if (!canExecuteSwapQueue(state)) {
    return;
  }

  if (dispatch(executeSwaps(getSwapQueue(state)))) {
    dispatch(clearSwapQueue());
    dispatch(closeSwapDronesDialog());
  }
};
