import { getBase64ShowBlob } from '~/features/show/selectors';
import messageHub from '~/message-hub';
import type { AppThunk } from '~/store/reducers';
import { writeBlobToFile } from '~/utils/filesystem';

import { selectTransformedShowBlob } from './selectors';
import { setResult, type TransformationResult } from './state';

export type OptionalCollectiveRTHParameters = {
  minDistance?: number;
  timeResolution?: number;
};

export type CollectiveRTHParameters = Required<OptionalCollectiveRTHParameters>;

export const addCollectiveRTH =
  (params?: CollectiveRTHParameters): AppThunk =>
  async (dispatch, getState): Promise<void> => {
    const state = getState();
    const base64ShowBlob = getBase64ShowBlob(state);
    dispatch(setResult({ loading: true }));

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { show, firstTime, lastTime, maxShowDuration } =
        // @ts-expect-error: ts(2339)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        await messageHub.query.addCollectiveRTH(base64ShowBlob, {
          min_distance: params?.minDistance,
          time_resolution: params?.timeResolution,
        });

      if (typeof show !== 'string') {
        throw new TypeError(
          'Invalid show response from collective RTH transformation.'
        );
      }

      const result: TransformationResult = { show };

      if (firstTime !== undefined) {
        if (typeof firstTime !== 'number') {
          throw new TypeError(
            'Invalid firstTime response from collective RTH transformation.'
          );
        }

        result.firstTime = firstTime;
      }

      if (lastTime !== undefined) {
        if (typeof lastTime !== 'number') {
          throw new TypeError(
            'Invalid lastTime response from collective RTH transformation.'
          );
        }

        result.lastTime = lastTime;
      }

      if (maxShowDuration !== undefined) {
        if (typeof maxShowDuration !== 'number') {
          throw new TypeError(
            'Invalid maxShowDuration response from collective RTH transformation.'
          );
        }

        result.maxShowDuration = maxShowDuration;
      }

      dispatch(setResult(result));
    } catch (error) {
      console.warn('addCollectiveRTH failed with error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : 'Unknown error type.';
      dispatch(setResult({ error: errorMessage }));
    }
  };

export const saveTransformedShow =
  (): AppThunk => async (_dispatch, getState) => {
    const adaptedBase64Show = selectTransformedShowBlob(getState());
    if (adaptedBase64Show) {
      await writeBlobToFile(adaptedBase64Show, 'adapted-show.skyc');
    }
  };
