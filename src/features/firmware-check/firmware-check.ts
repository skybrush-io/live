import type { VersionMap } from '@skybrush/flockwave-spec';
import { call } from 'redux-saga/effects';

import { createShowResultsPostAction } from '~/features/upload-support/value-consistency/actions';
import type {
  JobExecutorParams,
  JobSpecification,
} from '~/features/upload/jobs';
import messageHub from '~/message-hub';

import { FIRMWARE_CHECK_JOB_TYPE } from './constants';

/**
 * Handles the retrieval of firmware version information from a
 * single drone.
 */
function* getFirmwareVersionInfoFromUAV({
  uavId,
}: JobExecutorParams<void>): Generator<unknown, VersionMap> {
  const versions: VersionMap = yield call(
    messageHub.query.getFirmwareVersionInfo,
    uavId
  );
  return versions;
}

const spec: JobSpecification<void, void, VersionMap> = {
  executor: getFirmwareVersionInfoFromUAV,
  title: 'Firmware version check',
  type: FIRMWARE_CHECK_JOB_TYPE,
  postAction: createShowResultsPostAction(FIRMWARE_CHECK_JOB_TYPE),
};

export default spec;
