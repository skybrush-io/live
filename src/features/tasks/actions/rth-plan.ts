import { errorToString } from '~/error-handling';
import { getBase64ShowBlob } from '~/features/show/selectors';
import type { ProgressStatus } from '~/flockwave/messages';
import messageHub from '~/message-hub';
import type { AppThunk } from '~/store/reducers';

import { _completeTask, _failTask, _setTaskProgress } from '../slice';
import type { RTHPlanTaskSpec } from '../types';
import { getTaskKey } from '../utils';

/* The transformed show returned by the server is a large payload that must not
 * enter the Redux store. We keep the most recent one in a module-level slot and
 * store only its hash in the task state. The slot is discarded when a new
 * calculation starts or when the task is cleared; the UI design guarantees that
 * older results are never needed again (the user either approves the new show,
 * which replaces the loaded one, or rejects it). */

let calculatedShow: { hash: string; show: string } | undefined;

const hashString = async (value: string): Promise<string> => {
  const encoder = new TextEncoder();
  // prettier-ignore
  const hash = (
    Array.from(
      new Uint8Array(
        await window.crypto.subtle.digest('SHA-1', encoder.encode(value))
      ),
      (byte) => byte.toString(16).padStart(2, '0')
    ).join('')
  );
  return hash;
};

/**
 * Returns the base64-encoded transformed show from the most recent successful
 * collective RTH plan calculation, or `undefined` if the given hash does not
 * match the calculated show (i.e., a new calculation has started in the
 * meantime).
 */
export const readCalculatedShow = (hash: string): string | undefined =>
  calculatedShow?.hash === hash ? calculatedShow.show : undefined;

/**
 * Runner for the singleton collective RTH plan calculation task.
 *
 * The show file that the calculation depends upon is sampled from the show
 * feature at start time and is deliberately not part of the task
 * specification. Feedback about the outcome is left to the UI; the runner does
 * not emit notifications.
 */
export const runRTHPlanTask =
  (spec: RTHPlanTaskSpec): AppThunk<Promise<void>> =>
  async (dispatch, getState) => {
    const { params } = spec;
    const key = getTaskKey(spec);

    // The previous result (if any) is obsolete from this point on.
    calculatedShow = undefined;

    const base64ShowBlob = getBase64ShowBlob(getState());
    if (base64ShowBlob === undefined) {
      dispatch(_failTask({ key, error: 'Missing show data.' }));
      return;
    }

    const onProgress = ({ progress }: ProgressStatus) => {
      dispatch(_setTaskProgress({ key, progress }));
    };

    try {
      const response = await messageHub.query.addCollectiveRTH(
        base64ShowBlob,
        {
          min_distance: params.minDistance,
          time_resolution: params.timeResolution,
          velocity_xy: params.horizontalVelocity,
          velocity_z: params.verticalVelocity,
        },
        { onProgress }
      );

      const hash = await hashString(response.show);
      calculatedShow = { hash, show: response.show };

      const times = response.stats.map(({ time }) => time);
      dispatch(
        _completeTask({
          key,
          result: {
            hash,
            stats: response.stats,
            showDuration: response.showDuration,
            firstTime: Math.min(...times),
            lastTime: Math.max(...times),
          },
        })
      );
    } catch (error: unknown) {
      dispatch(_failTask({ key, error: errorToString(error) }));
    }
  };

/**
 * Clears the module-level slot holding the transformed show.
 */
export const clearRTHPlanTask = (): AppThunk => () => {
  calculatedShow = undefined;
};
