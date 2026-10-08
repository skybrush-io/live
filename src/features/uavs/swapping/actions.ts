import { adjustMissionMapping } from '~/features/mission/actions';
import {
  getMissionMapping,
  getReverseMissionMapping,
} from '~/features/mission/selectors';
import { SHOW_UPLOAD_JOB } from '~/features/show/constants';
import {
  openUploadDialogForJob,
  putUavsInWaitingQueue,
} from '~/features/upload/slice';
import type { AppThunk } from '~/store/reducers';

import type { ResolvedDronePair } from './types';
import {
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
