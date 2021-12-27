import max from 'lodash-es/max';
import memoize from 'memoizee';

import {
  isErrorCodeOrMoreSevere,
  isWarningCodeOrMoreSevere,
} from './status-codes';

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

export const getFilterFunctionForUAVFilter = memoize((filterId) => {
  switch (filterId) {
    case UAVFilter.WITH_ERRORS:
      return (uav) =>
        Array.isArray(uav?.errors) && uav.errors.length > 0
          ? isErrorCodeOrMoreSevere(max(uav.errors))
          : false;

    case UAVFilter.WITH_WARNINGS:
      return (uav) =>
        Array.isArray(uav?.errors) && uav.errors.length > 0
          ? isWarningCodeOrMoreSevere(max(uav.errors))
          : false;

    case UAVFilter.DEFAULT:
    default:
      return undefined;
  }
});
