import isObject from 'lodash-es/isObject';

import { getBase64ShowBlob } from '~/features/show/selectors';
import messageHub from '~/message-hub';
import type { AppThunk } from '~/store/reducers';
import { writeBlobToFile } from '~/utils/filesystem';

import { selectTransformedShowBlob } from './selectors';
import { setResult, type StatEntry, type TransformationResult } from './slice';

export type OptionalCollectiveRTHParameters = {
  minDistance?: number;
  timeResolution?: number;
  horizontalVelocity?: number;
  verticalVelocity?: number;
};

export type CollectiveRTHParameters = Required<OptionalCollectiveRTHParameters>;

// TODO: Replace this when the message type gets promoted from experimental
//       status and becomes defined in `@skybrush/flockwave-spec`
type Response_XSHOWCRTHPLAN = Pick<
  TransformationResult,
  'show' | 'showDuration' | 'stats'
>;

function validateStatEntry(stat: unknown): asserts stat is StatEntry {
  if (!isObject(stat)) {
    throw new TypeError(
      'Invalid stat in response to collective RTH transformation.'
    );
  }

  if (!('time' in stat) || typeof stat.time !== 'number') {
    throw new TypeError(
      'Invalid time in stat in response to collective RTH transformation.'
    );
  }

  if (!('duration' in stat) || typeof stat.duration !== 'number') {
    throw new TypeError(
      'Invalid duration in stat in response to collective RTH transformation.'
    );
  }

  if (!('showDuration' in stat) || typeof stat.showDuration !== 'number') {
    throw new TypeError(
      'Invalid showDuration in stat in response to collective RTH transformation.'
    );
  }
}

function validateResponse(
  resp: unknown
): asserts resp is Response_XSHOWCRTHPLAN {
  if (!isObject(resp)) {
    throw new TypeError('Invalid response from collective RTH transformation.');
  }

  if (!('show' in resp) || typeof resp.show !== 'string') {
    throw new TypeError(
      'Invalid show response from collective RTH transformation.'
    );
  }

  if (!('showDuration' in resp) || typeof resp.showDuration !== 'number') {
    throw new TypeError(
      'Invalid showDuration response from collective RTH transformation.'
    );
  }

  if (!('stats' in resp) || !Array.isArray(resp.stats)) {
    throw new TypeError(
      'Invalid stats response from collective RTH transformation.'
    );
  }

  if (resp.stats.length === 0) {
    throw new TypeError(
      'No stats returned from collective RTH transformation.'
    );
  }

  resp.stats.forEach(validateStatEntry);
}

export const addCollectiveRTH =
  (params?: CollectiveRTHParameters): AppThunk =>
  async (dispatch, getState): Promise<void> => {
    const state = getState();
    const base64ShowBlob = getBase64ShowBlob(state);
    dispatch(setResult({ state: 'loading' }));

    try {
      const response = await messageHub.query.addCollectiveRTH(base64ShowBlob, {
        min_distance: params?.minDistance,
        time_resolution: params?.timeResolution,
        velocity_xy: params?.horizontalVelocity,
        velocity_z: params?.verticalVelocity,
      });

      validateResponse(response);

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
