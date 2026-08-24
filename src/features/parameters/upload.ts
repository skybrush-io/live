import { call, select } from 'redux-saga/effects';

import { getServerVersionValidator } from '~/features/servers/selectors';
import type {
  JobExecutorParams,
  JobSpecification,
} from '~/features/upload/jobs';
import type { AsyncOperationOptions } from '~/flockwave/messages';
import messageHub from '~/message-hub';

import { UPLOAD_JOB_TYPE } from './constants';
import type { ParameterData } from './types';

const supportsBulkUpload = getServerVersionValidator('>=2.34.1');

type Payload = {
  items: ParameterData[];
  meta: {
    shouldReboot: boolean;
  };
};

/**
 * Handles a parameter upload session to a single drone.
 *
 * @param uavId    the ID of the UAV to upload the parameters to
 * @param payload  the parameters to upload
 */
function* runSingleParameterUpload(
  { uavId, payload }: JobExecutorParams<Payload>,
  options: AsyncOperationOptions
) {
  const { items, meta } = payload ?? {};

  if (!Array.isArray(items)) {
    return;
  }

  const uavItems = items.filter(
    (param) => param.uavId === undefined || param.uavId === uavId
  );
  if (uavItems.length === 0) {
    return;
  }

  const useBulkUpload: boolean = yield select(supportsBulkUpload);

  if (useBulkUpload) {
    const parameters = Object.fromEntries(
      uavItems.map(({ name, value }) => [name, value])
    );

    // No need for a timeout here; it utilizes the message hub, which has its
    // own timeout for failed command executions (although it is quite long)
    yield call(
      messageHub.execute.setParameters,
      { uavId, parameters },
      options
    );
  } else {
    for (const { name, value } of uavItems) {
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

const spec: JobSpecification<Payload> = {
  executor: runSingleParameterUpload,
  title: 'Upload parameters',
  type: UPLOAD_JOB_TYPE,
};

export default spec;
