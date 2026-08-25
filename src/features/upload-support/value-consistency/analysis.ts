import type { PerUAVJobResult } from '~/features/upload/types';
import type { Identifier } from '~/utils/collections';

import type { ValueConsistencyResult, ValueDistribution } from './types';

/**
 * Returns the most common value for each name in the distribution.
 */
const findMajority = (
  distribution: ValueDistribution
): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const [name, values] of Object.entries(distribution)) {
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
 * For each name present in `majority`, returns the UAV IDs whose value
 * differs from the majority value.
 */
const findInconsistencies = (
  distribution: ValueDistribution,
  majority: Record<string, string>
): Record<string, Identifier[]> => {
  const result: Record<string, Identifier[]> = {};
  for (const [name, majorityValue] of Object.entries(majority)) {
    for (const [value, uavIds] of Object.entries(distribution[name] ?? {})) {
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
 * Groups successful per-UAV named values by name and value, and collects
 * per-UAV errors.
 */
const collectValueDistribution = (
  perUAVResults: Record<Identifier, PerUAVJobResult<Record<string, unknown>>>
): {
  distribution: ValueDistribution;
  errors: Record<Identifier, string>;
} => {
  const distribution: ValueDistribution = {};
  const errors: Record<Identifier, string> = {};

  for (const [uavId, entry] of Object.entries(perUAVResults)) {
    if (entry.type === 'success') {
      for (const [name, value] of Object.entries(entry.result)) {
        const valueAsString = String(value);
        distribution[name] ??= {};
        distribution[name][valueAsString] ??= [];
        distribution[name][valueAsString].push(uavId);
      }
    } else if (entry.type === 'error') {
      errors[uavId] = entry.error;
    }
  }

  return { distribution, errors };
};

/**
 * Builds the value-consistency result from per-UAV job results.
 */
export const analyzeValueConsistency = (
  perUAVResults: Record<Identifier, PerUAVJobResult<Record<string, unknown>>>
): ValueConsistencyResult => {
  const { distribution, errors } = collectValueDistribution(perUAVResults);
  const majority = findMajority(distribution);
  const inconsistencies = findInconsistencies(distribution, majority);
  return { distribution, errors, majority, inconsistencies };
};
