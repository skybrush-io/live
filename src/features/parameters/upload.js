import messageHub from '~/message-hub';

import { JOB_TYPE } from './constants';

/**
 * Handles a parameter upload session to a single drone. Returns a promise that
 * resolves when all the parameers have been uploaded. The promise is extended
 * with a cancellation callback for Redux-saga.
 *
 * @param uavId    the ID of the UAV to upload the parameters to
 * @param payload  the parameters to upload
 */
async function runSingleParameterUpload({ uavId, payload }) {
  const { items, meta } = payload ?? {};

  if (!Array.isArray(items) || items.length === 0) {
    return;
  }

  for (const { name, value } of items) {
    // No need for a timeout here; it utilizes the message hub, which has its
    // own timeout for failed command executions (although it is quite long)

    // eslint-disable-next-line no-await-in-loop
    await messageHub.execute.setParameter({
      uavId,
      name,
      value,
    });
  }

  const { shouldReboot } = meta ?? {};
  if (shouldReboot) {
    await messageHub.execute.resetUAV(uavId);
  }
}

const spec = {
  executor: runSingleParameterUpload,
  title: 'Upload parameters',
  type: JOB_TYPE,
};

export default spec;
