/**
 * Enum that describes the possible filtering presets for a list that shows UAVs.
 */
export const UAVFilter = {
  DEFAULT: 'default',
  WITH_WARNINGS: 'withWarnings',
  WITH_ERRORS: 'withErrors',
};

/**
 * Order in which the UAV filter presets should appear on the UI.
 */
export const UAVFilters = [
  UAVFilter.DEFAULT,
  UAVFilter.WITH_WARNINGS,
  UAVFilter.WITH_ERRORS,
];

/**
 * Human-readable labels that should be used on the UI to represent a UAV filter preset.
 */
export const labelsForUAVFilter = {
  [UAVFilter.DEFAULT]: 'All',
  [UAVFilter.WITH_WARNINGS]: 'Warnings',
  [UAVFilter.WITH_ERRORS]: 'Errors',
};
