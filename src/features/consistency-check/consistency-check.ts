import { call } from 'redux-saga/effects';

import { createShowResultsPostAction } from '~/features/upload-support/value-consistency/actions';
import type {
  JobExecutorParams,
  JobSpecification,
} from '~/features/upload/jobs';
import messageHub from '~/message-hub';

import { CONSISTENCY_CHECK_JOB_TYPE } from './constants';

type Payload = string[];

/**
 * Handles the retrieval of a list of parameter values from a single drone.
 *
 * @param uavId    the ID of the UAV to retrieve the parameters from
 * @param payload  the list of parameters to retrieve
 */
function* runSingleParameterRetrieval({
  uavId,
  payload,
}: JobExecutorParams<Payload>) {
  const result: Record<string, unknown> = {};

  for (const name of payload) {
    // No need for a timeout here; it utilizes the message hub, which has its
    // own timeout for failed command executions (although it is quite long)
    const value: unknown = yield call(
      messageHub.query.getParameter,
      uavId,
      name
    );

    result[name] = value;
  }

  return result;
}

const spec: JobSpecification<Payload, void, Record<string, unknown>> = {
  executor: runSingleParameterRetrieval,
  title: 'Parameter consistency check',
  type: CONSISTENCY_CHECK_JOB_TYPE,
  postAction: createShowResultsPostAction(CONSISTENCY_CHECK_JOB_TYPE),
};

export default spec;
