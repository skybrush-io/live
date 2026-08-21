import { call } from 'redux-saga/effects';

import type {
  JobExecutorParams,
  JobSpecification,
} from '~/features/upload/jobs';
import { countResultsByTypeInHistoryItem } from '~/features/upload/utils';
import messageHub from '~/message-hub';
import type { AppThunk } from '~/store/reducers';

import { setUploadDialogSelectedTab } from '../upload/slice';
import { CONSISTENCY_CHECK_JOB_TYPE } from './constants';
import { selectLatestConsistencyCheckHistoryItem } from './selectors';

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

/**
 * Post-job action that shows a notification with a brief summary of the
 * consistency check results.
 */
const postAction = (): AppThunk => (dispatch, getState) => {
  const state = getState();
  const historyItem = selectLatestConsistencyCheckHistoryItem(state);
  if (historyItem === undefined) {
    return;
  }

  const counts = countResultsByTypeInHistoryItem(historyItem);
  if (counts.error === 0 && counts.success > 0 && counts.cancelled === 0) {
    // At least one success, no errors and no cancellations. Move on to the results panel.
    dispatch(setUploadDialogSelectedTab('results'));
  }
};

const spec: JobSpecification<Payload, void, Record<string, unknown>> = {
  executor: runSingleParameterRetrieval,
  title: 'Parameter consistency check',
  type: CONSISTENCY_CHECK_JOB_TYPE,
  postAction,
};

export default spec;
