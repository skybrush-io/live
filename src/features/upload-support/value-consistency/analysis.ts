import type { PerUAVJobResult } from '~/features/upload/types';
import type { Identifier } from '~/utils/collections';

import type {
  ValueConsistencyResult,
  ValueDistribution,
  ValueFix,
} from './types';

/**
 * Returns the most common value for each name in the distribution.
 */
const findMajority = (
  distribution: ValueDistribution
): Record<string, string> => {
  // Null prototype so that names such as "__proto__" act as own keys only
  const result: Record<string, string> = Object.create(null);
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
 * Returns the names for which multiple values are equally common.
 */
const findTies = (distribution: ValueDistribution): string[] =>
  Object.entries(distribution)
    .filter(([, values]) => {
      const counts = Object.values(values).map((uavIds) => uavIds.length);
      const maxCount = Math.max(...counts);
      return counts.filter((count) => count === maxCount).length > 1;
    })
    .map(([name]) => name)
    .sort();

/**
 * For each name present in `majority`, returns the UAV IDs whose value
 * differs from the majority value.
 */
const findInconsistencies = (
  distribution: ValueDistribution,
  majority: Record<string, string>
): Record<string, Identifier[]> => {
  const result: Record<string, Identifier[]> = Object.create(null);
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
  const distribution: ValueDistribution = Object.create(null);
  const errors: Record<Identifier, string> = Object.create(null);

  for (const [uavId, entry] of Object.entries(perUAVResults)) {
    if (entry.type === 'success') {
      for (const [name, value] of Object.entries(entry.result)) {
        const valueAsString = String(value);
        distribution[name] ??= Object.create(null);
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
  const tied = findTies(distribution);
  return { distribution, errors, majority, inconsistencies, tied };
};

/**
 * Returns the fixes that set the deviating values to the majority value.
 *
 * Names without a clear majority value are skipped.
 *
 * @param result  the value-consistency result
 * @param name    when given, only the fixes for this name are returned
 */
export const collectValueFixes = (
  result: ValueConsistencyResult,
  name?: string
): ValueFix[] => {
  const { distribution, majority, tied } = result;
  const names = name === undefined ? Object.keys(distribution) : [name];
  const fixes: ValueFix[] = [];

  for (const currentName of names) {
    const majorityValue = majority[currentName];
    if (majorityValue === undefined || tied.includes(currentName)) {
      continue;
    }

    for (const [currentValue, uavIds] of Object.entries(
      distribution[currentName] ?? {}
    )) {
      if (currentValue !== majorityValue) {
        fixes.push({ name: currentName, value: majorityValue, uavIds });
      }
    }
  }

  return fixes;
};
