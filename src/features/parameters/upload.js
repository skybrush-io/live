import { call, select } from 'redux-saga/effects';
import semver from 'semver';

import { getServerVersion } from '~/features/servers/selectors';
import messageHub from '~/message-hub';

import { JOB_TYPE } from './constants';

/**
 * Handles a parameter upload session to a single drone. Returns a promise that
 * resolves when all the parameters have been uploaded. The promise is extended
 * with a cancellation callback for Redux-saga.
 *
 * @param uavId    the ID of the UAV to upload the parameters to
 * @param payload  the parameters to upload
 */
function* runSingleParameterUpload({ uavId, payload }, options) {
  const { items, meta } = payload ?? {};

  if (!Array.isArray(items) || items.length === 0) {
    return;
  }

  const version = yield select(getServerVersion);
  const useBulkUpload = semver.gte(version, '2.34.1');

  if (useBulkUpload) {
    const parameters = Object.fromEntries(
      items.map(({ name, value }) => [name, value])
    );

    // No need for a timeout here; it utilizes the message hub, which has its
    // own timeout for failed command executions (although it is quite long)
    yield call(
      messageHub.execute.setParameters,
      { uavId, parameters },
      options
    );
  } else {
    for (const { name, value } of items) {
      // No need for a timeout here; it utilizes the message hub, which has its
      // own timeout for failed command executions (although it is quite long)
      yield call(messageHub.execute.setParameter, {
        uavId,
        name,
        value,
      });
    }
  }

  const { shouldReboot } = meta ?? {};
  if (shouldReboot) {
    yield call(messageHub.execute.resetUAV, uavId);
  }
}

const spec = {
  executor: runSingleParameterUpload,
  title: 'Upload parameters',
  type: JOB_TYPE,
};

export default spec;
