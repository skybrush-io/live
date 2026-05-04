import { createSelector } from '@reduxjs/toolkit';

import DefaultAPIKeys, { type APIKeysRecord } from '~/APIKeys';
import { BatteryFormatter } from '~/components/battery';
import { BatterySettings } from '~/model/battery';
import type { UAVFilter } from '~/model/filtering';
import {
  AltitudeSummaryType,
  BatteryDisplayStyle,
  UAVOperationConfirmationStyle,
} from '~/model/settings';
import { UAVSortKey } from '~/model/sorting';
import type { RootState } from '~/store/reducers';
import {
  UAVListLayout,
  UAVListOrientation,
  type UAVSortKeyAndOrder,
} from './types';

type UAVAgingThresholds = {
  goneThreshold: number;
  warnThreshold: number;
  forgetThreshold: number;
};

type UAVSettings = RootState['settings']['uavs'];

export const getAltitudeSummaryType = (state: RootState): AltitudeSummaryType =>
  state.settings.display?.altitudeSummaryType || AltitudeSummaryType.AMSL;

export const getBatterySettings = createSelector(
  (state: RootState) => state.settings.uavs,
  (uavsSettings: Partial<UAVSettings> = {}) => {
    const {
      defaultBatteryCellCount,
      fullChargeVoltage,
      lowVoltageThreshold,
      criticalVoltageThreshold,
    } = uavsSettings;

    return new BatterySettings({
      defaultBatteryCellCount,
      voltageThresholds: {
        full: fullChargeVoltage,
        low: lowVoltageThreshold,
        critical: criticalVoltageThreshold,
      },
    });
  }
);

export const getBatteryFormatter = createSelector(
  getBatterySettings,
  (state: RootState) => state.settings.uavs,
  (
    settings: BatterySettings,
    uavsSettings: Partial<UAVSettings> = {}
  ): BatteryFormatter => {
    const { preferredBatteryDisplayStyle = BatteryDisplayStyle.VOLTAGE } =
      uavsSettings;

    return new BatteryFormatter({
      settings,
      style: preferredBatteryDisplayStyle,
    });
  }
);

/**
 * Returns the desired placement accuracy that the user wants to use to judge
 * whether a drone is placed accurately at its start position, in meters.
 * Note that the state stores it in millimeters so we need to convert.
 *
 * Also, we need to enforce a default value in case the state store of the user
 * is old and it does not include a default value.
 */
export const getDesiredPlacementAccuracyInMeters = (state: RootState): number =>
  (state.settings.uavs.placementAccuracy ?? 1000) / 1000;

/**
 * Returns the desired accuracy of UAV headings that the user wants to use to
 * judge whether a drone is placed facing the right direction before a mission.
 *
 * We need to enforce a default value in case the state store of the user
 * is old and it does not include a default value.
 */
export const getDesiredTakeoffHeadingAccuracy = (state: RootState): number =>
  state.settings.uavs.takeoffHeadingAccuracy ?? 20;

/**
 * Returns the currently selected display language for the application.
 */
export const getDisplayLanguage = (state: RootState): string =>
  state.settings.display.language;

/**
 * Returns the name of the lighting conditions preset for the 3D view.
 */
export const getLightingConditionsForThreeDView = (
  state: RootState
): 'light' | 'dark' => {
  const { lighting } = state.settings.threeD;
  const scenery = String(state.settings.threeD.scenery);

  // Map legacy names to the new ones
  if (scenery === 'day') {
    return 'light';
  }

  if (scenery === 'night') {
    return 'dark';
  }

  if (lighting === 'light') {
    return 'light';
  }

  return 'dark';
};

/**
 * Returns the maximum number of concurrent upload tasks that the client should
 * attempt to start on the server during upload jobs.
 */
export const getMaximumConcurrentUploadTaskCount = (state: RootState): number =>
  state.settings.uavs.maxUploadConcurrency ?? 8;

/**
 * Returns the minimum allowed distance between two UAVs in an indoor show at
 * takeoff.
 */
export const getMinimumIndoorTakeoffSpacing = (state: RootState): number =>
  (state.settings.uavs.minIndoorTakeoffSpacing ?? 200) / 1000;

/**
 * Returns the minimum allowed distance between two UAVs in an indoor show at
 * takeoff.
 */
export const getMinimumOutdoorTakeoffSpacing = (state: RootState): number =>
  (state.settings.uavs.minOutdoorTakeoffSpacing ?? 400) / 1000;

/**
 * Returns the currently selected preferred battery display style.
 */
export const getPreferredBatteryDisplayStyle = (
  state: RootState
): BatteryDisplayStyle => state.settings.uavs.preferredBatteryDisplayStyle;

/**
 * Returns the name of the scenery preset for the 3D view.
 */
export const getSceneryForThreeDView = (
  state: RootState
): 'outdoor' | 'indoor' | 'auto' => {
  const result = String(state.settings.threeD.scenery);

  // Map legacy names to the new ones
  if (result === 'day' || result === 'night') {
    return 'outdoor';
  }

  if (result === 'indoor') {
    return 'indoor';
  }

  if (result === 'auto') {
    return 'auto';
  }

  return 'outdoor';
};

/**
 * Returns the "aging thresholds" for the UAVs that decide when a UAV should
 * be marked as inactive (no telemetry), gone or forgotten.
 */
export const getUAVAgingThresholds = createSelector(
  (state: RootState) => state.settings.uavs,
  ({
    warnThreshold,
    goneThreshold,
    forgetThreshold,
    autoRemove,
  }: UAVSettings): UAVAgingThresholds => ({
    // Conversion from seconds to msec happens here. Use some sensible lower
    // limits.
    goneThreshold: Math.max(1000, goneThreshold * 1000),
    warnThreshold: Math.max(1000, warnThreshold * 1000),
    forgetThreshold: autoRemove
      ? Math.max(1000, forgetThreshold * 1000)
      : Number.POSITIVE_INFINITY,
  })
);

const DEFAULT_FILTER: UAVFilter[] = [];
const DEFAULT_SORT: UAVSortKeyAndOrder = {
  key: UAVSortKey.UAV_ID,
  reverse: false,
};

/**
 * Returns the array of filters to apply for the list showing the UAVs.
 */
export const getUAVListFilters = (state: RootState): UAVFilter[] => {
  const result = state.settings.display?.uavListFilters;
  return result || DEFAULT_FILTER;
};

/**
 * Returns the current layout of the list showing the UAVs.
 */
export const getUAVListLayout = (state: RootState): UAVListLayout =>
  state.settings.display.uavListLayout;

/**
 * Returns the current primary orientation of the list or grid showing the UAVs.
 */
export const getUAVListOrientation = (state: RootState): UAVListOrientation =>
  getUAVListLayout(state) === UAVListLayout.GRID
    ? UAVListOrientation.HORIZONTAL
    : UAVListOrientation.VERTICAL;

/**
 * Returns the preferred sort order of the list showing the UAVs.
 *
 * The returned value is an object with two keys: <code>key</code>, which is
 * a value from the UAVSortKey enum, and <code>reverse</code>, which is
 * true if the UAVs are to be sorted in reverse order.
 *
 * Legacy persisted state that stores <code>UAVSortKey.DEFAULT</code> is
 * transparently mapped to <code>UAVSortKey.UAV_ID</code>.
 */
export function getUAVListSortPreference(state: RootState): UAVSortKeyAndOrder {
  const result = state.settings.display?.uavListSortPreference;
  if (!result) {
    return DEFAULT_SORT;
  }

  if (result.key === UAVSortKey.DEFAULT) {
    return { ...result, key: UAVSortKey.UAV_ID };
  }

  return result;
}

/**
 * Returns whether UAV operations dispatched from toolbars or buttons should
 * be confirmed by the user.
 */
export function getUAVOperationConfirmationStyle(
  state: RootState
): UAVOperationConfirmationStyle {
  return (
    state.settings.uavs?.uavOperationConfirmationStyle ||
    UAVOperationConfirmationStyle.NEVER
  );
}

/**
 * Returns whether we are currently showing empty mission slots in the UAV list.
 */
export const isShowingEmptyMissionSlots = (state: RootState): boolean =>
  !state.settings.display?.hideEmptyMissionSlots;

/**
 * Returns whether we are currently showing mission IDs on the screen
 * where possible.
 */
export const isShowingMissionIds = (state: RootState): boolean =>
  state.settings.display?.showMissionIds ?? false;

/**
 * Returns whether the user is allowed to see experimental features that are
 * not ready for production use yet.
 */
export const areExperimentalFeaturesEnabled = (state: RootState): boolean =>
  state.settings.display?.experimentalFeaturesEnabled ?? false;

/**
 * Returns whether the app should ask for a confirmation when performing a
 * UAV operation affecting the given UAVs.
 */
export function shouldConfirmUAVOperation(
  state: RootState,
  uavs: string[] | null | undefined,
  isBroadcast: boolean
): boolean {
  const style = getUAVOperationConfirmationStyle(state);

  switch (style) {
    case UAVOperationConfirmationStyle.ALWAYS:
      return true;

    case UAVOperationConfirmationStyle.ONLY_MULTIPLE:
      return isBroadcast || (Array.isArray(uavs) && uavs.length > 1);

    default:
      return false;
  }
}

/**
 * Returns whether the inactive segments of LCD clocks should be hidden when a
 * dark theme is in use.
 */
export const shouldShowInactiveSegmentsOnDarkLCD = (
  state: RootState
): boolean => state.settings.display?.hideInactiveSegmentsOnDarkLCD ?? false;

/**
 * Returns whether the application should be optimized for single UAV operation.
 */
export const shouldOptimizeForSingleUAV = (state: RootState): boolean =>
  state.settings.display?.optimizeForSingleUAV ?? false;

/**
 * Returns whether the UI should be adjusted primarily for touch based input.
 */
export const shouldOptimizeUIForTouch = (state: RootState): boolean =>
  state.settings.display?.optimizeUIForTouch ?? false;

/**
 * Returns an object mapping service identifiers to their API keys.
 */
export const getAPIKeys = createSelector(
  (state: RootState) => state.settings.apiKeys,
  (apiKeys): APIKeysRecord => {
    const result: APIKeysRecord = {
      BING: '',
      GOOGLE: '',
      MAPBOX: '',
      MAPTILER: '',
      NEXTZEN: '',
    };

    for (const key of Object.keys(result) as Array<keyof APIKeysRecord>) {
      const value = apiKeys[key] ?? DefaultAPIKeys[key];
      result[key] = value ? String(value) : '';
    }

    return result;
  }
);
