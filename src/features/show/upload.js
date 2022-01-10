import { CANCEL } from 'redux-saga';

import messageHub from '~/message-hub';

import { JOB_TYPE } from './constants';
import { createShowConfigurationForUav } from './selectors';

/**
 * Handles a single trajectory upload to a drone. Returns a promise that resolves
 * when the trajectory is uploaded. The promise is extended with a cancellation
 * callback for Redux-saga.
 *
 * @param uavId    the ID of the UAV to upload the show trajectory to
 * @param data     the show specification, as selected from the state store
 */
async function runSingleShowUpload({ uavId, data }) {
  // No need for a timeout here; it utilizes the message hub, which has its
  // own timeout for failed command executions (although it is quite long)
  const cancelToken = messageHub.createCancelToken();
  const promise = messageHub.execute.uploadDroneShow(
    { uavId, data },
    { cancelToken }
  );
  promise[CANCEL] = () => cancelToken.cancel({ allowFailure: true });
  return promise;
}

const spec = {
  executor: runSingleShowUpload,
  selector: createShowConfigurationForUav,
  title: 'Upload show data',
  type: JOB_TYPE,
};

export default spec;
