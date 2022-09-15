import { CANCEL } from 'redux-saga';

import { JobScope } from '~/features/upload/jobs';
import messageHub from '~/message-hub';

import { JOB_TYPE } from './constants';

/**
 * Handles a mision item upload session to a single drone. Returns a promise that
 * resolves when all the mission items have been uploaded. The promise is extended
 * with a cancellation callback for Redux-saga.
 *
 * @param uavId    the ID of the UAV to upload the mission items to
 * @param payload  the mission items
 */
async function runSingleMissionItemUpload({ uavId, payload }) {
  const { items } = payload ?? {};

  if (!Array.isArray(items) || items.length === 0) {
    return;
  }

  // No need for a timeout here; it utilizes the message hub, which has its
  // own timeout for failed command executions (although it is quite long)
  const cancelToken = messageHub.createCancelToken();
  const promise = messageHub.execute.uploadMission(
    { uavId, data: payload, format: 'skybrush-live/mission-items' },
    { cancelToken }
  );
  promise[CANCEL] = () => cancelToken.cancel({ allowFailure: true });
  return promise;
}

const spec = {
  executor: runSingleMissionItemUpload,
  scope: JobScope.SINGLE,
  title: 'Upload mission items',
  type: JOB_TYPE,
};

export default spec;
