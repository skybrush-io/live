import { call } from 'redux-saga/effects';

import { showError, showSuccess } from '~/features/snackbar/actions';
import type {
  JobExecutorParams,
  JobSpecification,
} from '~/features/upload/jobs';
import messageHub from '~/message-hub';
import type { AppThunk } from '~/store/reducers';
import { formatIdsAndTruncateTrailingItems as formatUAVIds } from '~/utils/formatting';

import { CONSISTENCY_CHECK_JOB_TYPE } from './constants';
import { selectLatestConsistencyCheckHistoryItem } from './selectors';
import {
  calculateParameterAndErrorMaps,
  findInconsistencies,
  findMajority,
} from './utils';

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
const postAction = (): AppThunk => (_dispatch, getState) => {
  const historyItem = selectLatestConsistencyCheckHistoryItem(getState());
  if (historyItem === undefined) {
    return;
  }

  let errorCount = 0;
  let successCount = 0;
  for (const entry of Object.values(historyItem.perUAVResults)) {
    if (entry.type === 'success') {
      successCount++;
    } else if (entry.type === 'error') {
      errorCount++;
    }
  }

  // No results, no failures, nothing to report.
  if (successCount === 0 && errorCount === 0) {
    return;
  }

  const summary = `Parameter consistency check completed. ${successCount} UAV(s) succeeded, ${errorCount} UAV(s) failed.`;
  if (successCount === 0) {
    showError(summary, { permanent: true });
    return;
  }

  const { parameterMap } = calculateParameterAndErrorMaps(
    historyItem.perUAVResults
  );
  const consensus = findMajority(parameterMap);
  const differences = findInconsistencies(parameterMap, consensus);

  if (Object.keys(differences).length === 0) {
    showSuccess(summary, { permanent: true });
    return;
  }

  const lines = [summary, '', 'Inconsistent UAVs by parameter:'];
  for (const name of Object.keys(differences).sort()) {
    const inconsistentIds = differences[name];
    const consistentCount = parameterMap[name]?.[consensus[name]]?.length ?? 0;
    lines.push(
      `  ${name}: consistent on ${consistentCount} UAV(s), inconsistent on ${formatUAVIds(inconsistentIds)}`
    );
  }

  showError(lines.join('\n'), { permanent: true });
};

const spec: JobSpecification<Payload, void, Record<string, unknown>> = {
  executor: runSingleParameterRetrieval,
  title: 'Parameter consistency check',
  type: CONSISTENCY_CHECK_JOB_TYPE,
  postAction,
};

export default spec;
