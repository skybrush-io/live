import { Base64 } from 'js-base64';

import { startTask } from '~/features/tasks';
import type { CollectiveRTHParameters } from '~/flockwave/types';
import type { AppThunk } from '~/store/reducers';
import { writeBlobToFile } from '~/utils/filesystem';

import { COLLECTIVE_RTH_DEFAULTS } from './constants';
import { selectCalculatedShowWithRTHPlan } from './selectors';

export type { CollectiveRTHParameters } from '~/flockwave/types';

/**
 * Starts the collective RTH plan calculation task with the given parameters
 * (or the defaults if no parameters are specified).
 *
 * Progress updates, the outcome and the result of the calculation are tracked
 * in the tasks feature; the dialog reads them from there.
 */
export const addCollectiveRTH =
  (params?: CollectiveRTHParameters): AppThunk =>
  (dispatch) => {
    void dispatch(
      startTask(
        {
          type: 'rth-plan',
          params: params ?? COLLECTIVE_RTH_DEFAULTS,
        },
        { silent: true }
      )
    );
  };

export const saveTransformedShow =
  (): AppThunk => async (_dispatch, getState) => {
    const base64Show = selectCalculatedShowWithRTHPlan(getState());
    if (base64Show) {
      const bytes = new Uint8Array(Base64.toUint8Array(base64Show));
      await writeBlobToFile(new Blob([bytes]), 'transformed-show.skyc');
    }
  };
