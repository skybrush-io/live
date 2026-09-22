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
};
