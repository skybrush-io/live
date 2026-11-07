import type { Identifier } from '~/utils/collections';

/**
 * Record that maps names to value -> ID list mappings.
 *
 * Example: `{ name1: { value1: ['uav1', 'uav2'], value2: ['uav3'] } }`.
 */
export type ValueDistribution = Record<string, Record<string, Identifier[]>>;

/**
 * Aggregated result of comparing named values across UAVs.
 */
export type ValueConsistencyResult = {
  distribution: ValueDistribution;
  errors: Record<Identifier, string>;
  majority: Record<string, string>;
  inconsistencies: Record<string, Identifier[]>;

  /**
   * Names for which multiple values are equally common, i.e. there is no
   * clear majority value. The value in `majority` is arbitrary for these.
   */
  tied: readonly string[];
};

/**
 * Request to set the value of a name to the given value on the given UAVs.
 */
export type ValueFix = {
  name: string;
  value: string;
  uavIds: Identifier[];
};
