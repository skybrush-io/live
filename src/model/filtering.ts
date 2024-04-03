import * as memoize from 'memoizee';

import { type StoredUAV } from '~/features/uavs/types';

import {
  isErrorCodeOrMoreSevere,
  isWarningCodeOrMoreSevere,
} from './status-codes';
import { UAVAge } from './uav';

/**
 * Enum that describes the possible filtering presets for a list that shows UAVs.
 */
export enum UAVFilter {
  DEFAULT = 'default',
  WITH_WARNINGS = 'withWarnings',
  WITH_ERRORS = 'withErrors',
  INACTIVE_ONLY = 'inactiveOnly',
  // INACTIVE_ONLY could be NO_TELEMETRY after the rename, but we cannot change
  // its string value because people might have saved state slices with
  // 'inactiveOnly' and it would be a fuss to migrate these. So, to keep things
  // simple and consistent, we kept the old naming and changed the _displayed_
  // labels only.
}

/**
 * Order in which the UAV filter presets should appear on the UI.
 */
export const UAVFilters: readonly UAVFilter[] = [
  UAVFilter.DEFAULT,
  UAVFilter.WITH_WARNINGS,
  UAVFilter.WITH_ERRORS,
  UAVFilter.INACTIVE_ONLY,
] as const;

/**
 * Human-readable labels that should be used on the UI to represent a UAV filter preset.
 */
export const labelsForUAVFilter: Record<UAVFilter, string> = {
  [UAVFilter.DEFAULT]: 'filtering.all',
  [UAVFilter.WITH_WARNINGS]: 'filtering.warningsAndErrors',
  [UAVFilter.WITH_ERRORS]: 'filtering.errorsOnly',
  [UAVFilter.INACTIVE_ONLY]: 'filtering.noTelemetryOnly',
};

/**
 * Human-readable short labels that should be used on the UI to represent a UAV filter preset.
 */
export const shortLabelsForUAVFilter: Record<UAVFilter, string> = {
  [UAVFilter.DEFAULT]: 'filtering.label.all',
  [UAVFilter.WITH_WARNINGS]: 'filtering.label.warnErr',
  [UAVFilter.WITH_ERRORS]: 'filtering.label.errors',
  [UAVFilter.INACTIVE_ONLY]: 'filtering.label.noTelem',
};

export const getFilterFunctionForUAVFilter = memoize(
  (
    filterId: UAVFilter
  ): ((uav: StoredUAV | undefined) => boolean) | undefined => {
    switch (filterId) {
      case UAVFilter.WITH_ERRORS:
        return (uav) =>
          uav && Array.isArray(uav.errors) && uav.errors.length > 0
            ? isErrorCodeOrMoreSevere(Math.max(...uav.errors))
            : false;

      case UAVFilter.WITH_WARNINGS:
        return (uav) =>
          uav && Array.isArray(uav.errors) && uav.errors.length > 0
            ? isWarningCodeOrMoreSevere(Math.max(...uav.errors))
            : false;

      case UAVFilter.INACTIVE_ONLY:
        return (uav) => uav?.age === UAVAge.INACTIVE;

      default:
        return undefined;
    }
  }
);
