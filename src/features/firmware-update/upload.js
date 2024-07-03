import { call } from 'redux-saga/effects';

import messageHub from '~/message-hub';

import { JOB_TYPE } from './constants';

/**
 * Handles a firmware upload session to a single object. Returns a promise that
 * resolves when the firmware has been uploaded. The promise is extended
 * with a cancellation callback for Redux-saga.
 *
 * @param objectId the ID of the object to upload the firmware to
 * @param payload  the target and blob to upload
 */
function* runSingleFirmwareUpdate(
  {
    uavId: objectId, // TODO: Generalize upload saga from `uavId` to `objectId`
    payload,
  },
  options
) {
  const { target, blob } = payload ?? {};
  yield call(
    messageHub.execute.uploadFirmware,
    { objectId, target, blob },
    options
  );
}

const spec = {
  executor: runSingleFirmwareUpdate,
  title: 'Update firmware',
  type: JOB_TYPE,
};

export default spec;
