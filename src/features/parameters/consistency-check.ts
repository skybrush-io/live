import { call } from 'redux-saga/effects';

import { showError, showSuccess } from '~/features/snackbar/actions';
import type {
  JobExecutorParams,
  JobSpecification,
} from '~/features/upload/jobs';
import messageHub from '~/message-hub';
import { formatIdsAndTruncateTrailingItems as formatUAVIds } from '~/utils/formatting';

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

type ParameterMap = Record<string, Record<string, string[]>>;

const findMajority = (map: ParameterMap) => {
  const result: Record<string, string> = {};
  for (const [name, values] of Object.entries(map)) {
    const counts: Record<string, number> = {};
    let maxCount = -1;
    let mostCommonValue: string | undefined = undefined;

    for (const [value, uavIds] of Object.entries(values)) {
      counts[value] = uavIds.length;
      if (uavIds.length > maxCount) {
        maxCount = uavIds.length;
        mostCommonValue = value;
      }
    }

    if (mostCommonValue !== undefined) {
      result[name] = mostCommonValue;
    }
  }

  return result;
};

const findInconsistencies = (
  map: ParameterMap,
  majority: Record<string, string>
) => {
  const result: Record<string, string[]> = {};
  for (const [name, majorityValue] of Object.entries(majority)) {
    for (const [value, uavIds] of Object.entries(map[name] ?? {})) {
      if (value !== majorityValue) {
        result[name] ??= [];
        result[name].push(...uavIds);
      }
    }
  }

  for (const name of Object.keys(result)) {
    result[name].sort();
  }

  return result;
};

const spec: JobSpecification<
  Payload,
  void,
  Record<string, unknown>,
  ParameterMap
> = {
  executor: runSingleParameterRetrieval,
  title: 'Parameter consistency check',
  type: CONSISTENCY_CHECK_JOB_TYPE,

  result: {
    create: () => ({}),

    update(parameterMap, values, uavId) {
      for (const [name, value] of Object.entries(values)) {
        const valueAsString = String(value);
        parameterMap[name] ??= {};
        parameterMap[name][valueAsString] ??= [];
        parameterMap[name][valueAsString].push(uavId);
      }
    },
  },

  postAction: (parameterMap) => () => {
    if (!parameterMap) {
      return;
    }

    const consensus = findMajority(parameterMap);
    const formattedConsensus = Object.entries(consensus)
      .map(([name, value]) => `${name} = ${value}`)
      .join('\n');
    const differences = findInconsistencies(parameterMap, consensus);

    if (Object.keys(differences).length > 0) {
      const formattedDifferences = Object.entries(differences)
        .map(([name, ids]) => `${name}: ${formatUAVIds(ids, { maxCount: 10 })}`)
        .join('\n');
      showError(
        `Some parameters are not consistent. Consensus values:\n\n${formattedConsensus}\n\nDifferences:\n\n${formattedDifferences}`,
        { permanent: true }
      );
    } else {
      showSuccess(
        `All parameters are consistent. Consensus values:\n\n${formattedConsensus}`,
        { permanent: true }
      );
    }
  },
};

export default spec;
