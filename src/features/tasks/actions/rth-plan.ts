import { errorToString } from '~/error-handling';
import { getBase64ShowBlob } from '~/features/show/selectors';
import type { ProgressStatus } from '~/flockwave/messages';
import messageHub from '~/message-hub';
import type { AppThunk } from '~/store/reducers';

import { deleteTaskPayload, writeTaskPayload } from '../payload-store';
import { _completeTask, _failTask, _setTaskProgress } from '../slice';
import type { RTHPlanTaskSpec } from '../types';
import { getTaskKey } from '../utils';

/* The transformed show returned by the server is a large payload, so it is
 * kept in the payload store and only its hash is stored in the task state.
 * The payload store keeps entries once written; for this singleton task we
 * track the hash of the last written payload so that it can be discarded when
 * a new calculation starts. The UI design guarantees that the previous result
 * is never needed again (the user either approves the new show, which replaces
 * the loaded one, or rejects it). */

let lastPayloadHash: string | undefined;

const discardLastPayload = () => {
  if (lastPayloadHash !== undefined) {
    deleteTaskPayload(lastPayloadHash);
    lastPayloadHash = undefined;
  }
};

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
    discardLastPayload();

    const base64ShowBlob = getBase64ShowBlob(getState());
    if (base64ShowBlob === undefined) {
      dispatch(_failTask({ key, error: 'Missing show data.' }));
      return;
    }

    const onProgress = ({ progress }: ProgressStatus) => {
      dispatch(_setTaskProgress({ key, progress }));
    };

    try {
      const response = await messageHub.execute.addCollectiveRTH(
        base64ShowBlob,
        {
          min_distance: params.minDistance,
          time_resolution: params.timeResolution,
          velocity_xy: params.horizontalVelocity,
          velocity_z: params.verticalVelocity,
        },
        { onProgress }
      );

      const hash = await writeTaskPayload(response.show);
      lastPayloadHash = hash;

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
 * Discards the transformed show of the most recent collective RTH plan
 * calculation from the payload store.
 */
export const clearRTHPlanTask = (): AppThunk => () => {
  discardLastPayload();
};
