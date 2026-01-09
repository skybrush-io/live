import { getBase64ShowBlob } from '~/features/show/selectors';
import messageHub from '~/message-hub';
import type { AppThunk } from '~/store/reducers';
import { writeBlobToFile } from '~/utils/filesystem';

import { selectTransformedShowBlob } from './selectors';
import { setResult } from './state';

export type OptionalCollectiveRTHParameters = {
  minDistance?: number;
  timeResolution?: number;
  horizontalVelocity?: number;
  verticalVelocity?: number;
};

export type CollectiveRTHParameters = Required<OptionalCollectiveRTHParameters>;

export const addCollectiveRTH =
  (params?: CollectiveRTHParameters): AppThunk =>
  async (dispatch, getState): Promise<void> => {
    const state = getState();
    const base64ShowBlob = getBase64ShowBlob(state);
    dispatch(setResult({ loading: true }));

    try {
      const { show, showDuration, stats } =
        // @ts-expect-error: ts(2339)
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        await messageHub.query.addCollectiveRTH(base64ShowBlob, {
          min_distance: params?.minDistance,
          time_resolution: params?.timeResolution,
          velocity_xy: params?.horizontalVelocity,
          velocity_z: params?.verticalVelocity,
        });

      if (typeof show !== 'string') {
        throw new TypeError(
          'Invalid show response from collective RTH transformation.'
        );
      }

      if (typeof showDuration !== 'number') {
        throw new TypeError(
          'Invalid showDuration response from collective RTH transformation.'
        );
      }

      if (!Array.isArray(stats)) {
        throw new TypeError(
          'Invalid stats response from collective RTH transformation.'
        );
      }

      if (stats.length === 0) {
        throw new TypeError(
          'No stats returned from collective RTH transformation.'
        );
      }

      let firstTime: number = Number.POSITIVE_INFINITY;
      let lastTime: number = Number.NEGATIVE_INFINITY;

      for (const stat of stats) {
        if (typeof stat !== 'object') {
          throw new TypeError(
            'Invalid stat in response to collective RTH transformation.'
          );
        }

        if (typeof stat.time !== 'number') {
          throw new TypeError(
            'Invalid time in stat in response to collective RTH transformation.'
          );
        }

        if (typeof stat.duration !== 'number') {
          throw new TypeError(
            'Invalid duration in stat in response to collective RTH transformation.'
          );
        }

        if (typeof stat.showDuration !== 'number') {
          throw new TypeError(
            'Invalid showDuration in stat in response to collective RTH transformation.'
          );
        }

        firstTime = Math.min(firstTime, stat.time as number);
        lastTime = Math.max(lastTime, stat.time as number);
      }

      dispatch(setResult({ show, showDuration, stats, firstTime, lastTime }));
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
