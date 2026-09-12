import { getBase64ShowBlob } from '~/features/show/selectors';
import type { CollectiveRTHParameters } from '~/flockwave/types';
import messageHub from '~/message-hub';
import type { AppThunk } from '~/store/reducers';
import { writeBlobToFile } from '~/utils/filesystem';

import { selectTransformedShowBlob } from './selectors';
import { setResult } from './slice';

export const addCollectiveRTH =
  (params?: CollectiveRTHParameters): AppThunk =>
  async (dispatch, getState): Promise<void> => {
    const state = getState();
    const base64ShowBlob = getBase64ShowBlob(state);
    if (base64ShowBlob === undefined) {
      dispatch(setResult({ state: 'error', error: 'Missing show data.' }));
      return;
    }

    dispatch(setResult({ state: 'loading' }));

    try {
      const response = await messageHub.query.addCollectiveRTH(base64ShowBlob, {
        min_distance: params?.minDistance,
        time_resolution: params?.timeResolution,
        velocity_xy: params?.horizontalVelocity,
        velocity_z: params?.verticalVelocity,
      });

      const times = response.stats.map(({ time }) => time);
      const firstTime = Math.min(...times);
      const lastTime = Math.max(...times);

      dispatch(
        setResult({ state: 'success', ...response, firstTime, lastTime })
      );
    } catch (error) {
      console.warn('addCollectiveRTH failed with error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : 'Unknown error type.';
      dispatch(setResult({ state: 'error', error: errorMessage }));
    }
  };

export const saveTransformedShow =
  (): AppThunk => async (_dispatch, getState) => {
    const base64Show = selectTransformedShowBlob(getState());
    if (base64Show) {
      await writeBlobToFile(base64Show, 'transformed-show.skyc');
    }
  };
