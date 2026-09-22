import { call } from 'redux-saga/effects';

import type {
  JobExecutorParams,
  JobSpecification,
} from '~/features/upload/jobs';
import { JobScope } from '~/features/upload/jobs';
import type { ProgressStatus } from '~/flockwave/messages';
import messageHub from '~/message-hub';

import { JOB_TYPE } from './constants';

type Payload = {
  target: string;
  blob: string;
};

/**
 * Handles a firmware upload session to a single object. Returns a promise that
 * resolves when the firmware has been uploaded. The promise is extended
 * with a cancellation callback for Redux-saga.
 *
 * @param objectId the ID of the object to upload the firmware to
 * @param payload  the target and blob to upload
 */
function* runSingleFirmwareUpdate(
  { uavId: objectId, payload }: JobExecutorParams<Payload>,
  options: { onProgress: (id: string, status: ProgressStatus) => void }
) {
  const { target, blob } = payload;
  yield call(
    messageHub.execute.uploadFirmware,
    { objectId, target, blob },
    options
  );
}

const spec: JobSpecification<Payload> = {
  executor: runSingleFirmwareUpdate,
  scope: JobScope.COMPATIBLE,
  title: 'Update firmware',
  type: JOB_TYPE,
};

export default spec;
