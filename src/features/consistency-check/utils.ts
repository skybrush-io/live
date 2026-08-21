import type { PerUAVJobResult } from '~/features/upload/types';
import type { Identifier } from '~/utils/collections';

import type { ParameterMap } from './types';

/**
 * Finds the most common parameter value for each parameter name
 * in the given parameter map, and returns a parameter name to
 * most common value mapping.
 */
export const findMajority = (
  parameterMap: ParameterMap
): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const [name, values] of Object.entries(parameterMap)) {
    let maxCount = -1;
    let mostCommonValue: string | undefined = undefined;

    for (const [value, uavIds] of Object.entries(values)) {
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

/**
 * For each parameter name, collects the UAV IDs whose parameter value does not
 * match the majority value. Only parameter names in `majority` are considered.
 *
 * @param parameterMap The parameter map to check for inconsistencies.
 * @param majority The majority parameter values to compare against.
 * @returns A parameter name to UAV ID array mapping of inconsistencies.
 */
export const findInconsistencies = (
  parameterMap: ParameterMap,
  majority: Record<string, string>
): Record<string, string[]> => {
  const result: Record<string, string[]> = {};
  for (const [name, majorityValue] of Object.entries(majority)) {
    for (const [value, uavIds] of Object.entries(parameterMap[name] ?? {})) {
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

/**
 * Calculates the parameter and error maps from the given per-UAV results.
 */
export const calculateParameterAndErrorMaps = (
  perUAVResults: Record<Identifier, PerUAVJobResult<Record<string, unknown>>>
): { parameterMap: ParameterMap; errors: Record<Identifier, string> } => {
  const parameterMap: ParameterMap = {};
  const errors: Record<Identifier, string> = {};

  for (const [uavId, entry] of Object.entries(perUAVResults)) {
    if (entry.type === 'success') {
      for (const [name, value] of Object.entries(entry.result)) {
        const valueAsString = String(value);
        parameterMap[name] ??= {};
        parameterMap[name][valueAsString] ??= [];
        parameterMap[name][valueAsString].push(uavId);
      }
    } else if (entry.type === 'error') {
      errors[uavId] = entry.error;
    }
  }

  return { parameterMap, errors };
};

/**
 * Calculates the majority value and the inconsistencies for the given parameter map.
 * Returns an object containing the majority values and the inconsistencies.
 */
export const calculateMajorityAndInconsistencies = (
  parameterMap: ParameterMap
): {
  majority: Record<string, string>;
  inconsistencies: Record<string, string[]>;
} => {
  const majority = findMajority(parameterMap);
  const inconsistencies = findInconsistencies(parameterMap, majority);
  return { majority, inconsistencies };
};
