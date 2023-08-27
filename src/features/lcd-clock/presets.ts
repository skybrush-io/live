export const NUM_PRESETS = 5;

/**
 * Returns the index that follows the given preset index, wrapping around
 * if needed.
 */
export function getNextPresetIndex(index: number): number {
  return (index + 1) % NUM_PRESETS;
}
