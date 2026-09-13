import { Base64 } from 'js-base64';

import { showError } from '~/features/snackbar/actions';
import { startTask } from '~/features/tasks';
import type { CollectiveRTHParameters } from '~/flockwave/types';
import type { AppThunk } from '~/store/reducers';
import { writeBlobToFile } from '~/utils/filesystem';

import { selectCalculatedShowWithRTHPlan, selectParameters } from './selectors';
import { setParameters } from './slice';
import { areCollectiveRTHParametersValid } from './validation';

export type { CollectiveRTHParameters } from '~/flockwave/types';

/**
 * Starts the collective RTH plan calculation task with the given parameters
 * (or the persisted defaults if no parameters are specified).
 *
 * Valid, explicitly given parameters are also stored back into the state so
 * they become the defaults of the next calculation.
 *
 * Progress updates, the outcome and the result of the calculation are tracked
 * in the tasks feature; the dialog reads them from there.
 */
export const addCollectiveRTH =
  (params?: CollectiveRTHParameters): AppThunk =>
  (dispatch, getState) => {
    const effectiveParams = params ?? selectParameters(getState());

    if (params && areCollectiveRTHParametersValid(params)) {
      dispatch(setParameters(params));
    }

    void dispatch(
      startTask(
        {
          type: 'rth-plan',
          params: effectiveParams,
        },
        { silent: true }
      )
    );
  };

export const rejectTransformedShow = (): AppThunk => () => {
  // TODO(ntamas)
  showError('Not implemented yet.');
};

export const saveTransformedShow =
  (): AppThunk => async (_dispatch, getState) => {
    const base64Show = selectCalculatedShowWithRTHPlan(getState());
    if (base64Show) {
      const bytes = new Uint8Array(Base64.toUint8Array(base64Show));
      await writeBlobToFile(new Blob([bytes]), 'transformed-show.skyc');
    }
  };
