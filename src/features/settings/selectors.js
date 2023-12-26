import { createSelector } from '@reduxjs/toolkit';

import DefaultAPIKeys from '~/APIKeys';
import { BatteryFormatter } from '~/components/battery';
import { BatterySettings } from '~/model/battery';
import {
  AltitudeSummaryType,
  BatteryDisplayStyle,
  UAVOperationConfirmationStyle,
} from '~/model/settings';
import { UAVSortKey } from '~/model/sorting';

export const getAltitudeSummaryType = (state) =>
  state.settings.display?.altitudeSummaryType || AltitudeSummaryType.AMSL;

export const getBatterySettings = createSelector(
  (state) => state.settings.uavs,
  ({
    defaultBatteryCellCount,
    fullChargeVoltage,
    lowVoltageThreshold,
    criticalVoltageThreshold,
  } = {}) =>
    new BatterySettings({
      defaultBatteryCellCount,
      voltageThresholds: {
        full: fullChargeVoltage,
        low: lowVoltageThreshold,
        critical: criticalVoltageThreshold,
      },
    })
);

export const getBatteryFormatter = createSelector(
  getBatterySettings,
  (state) => state.settings.uavs,
  (
    settings,
    { preferredBatteryDisplayStyle = BatteryDisplayStyle.VOLTAGE } = {}
  ) => new BatteryFormatter({ settings, style: preferredBatteryDisplayStyle })
);

/**
 * Returns the desired placement accuracy that the user wants to use to judge
 * whether a drone is placed accurately at its start position, in meters.
 * Note that the state stores it in millimeters so we need to convert.
 *
 * Also, we need to enforce a default value in case the state store of the user
 * is old and it does not include a default value.
 */
export const getDesiredPlacementAccuracyInMeters = (state) =>
  (state.settings.uavs.placementAccuracy || 1000) / 1000;

/**
 * Returns the desired accuracy of UAV headings that the user wants to use to
 * judge whether a drone is placed facing the right direction before a mission.
 *
 * We need to enforce a default value in case the state store of the user
 * is old and it does not include a default value.
 */
export const getDesiredTakeoffHeadingAccuracy = (state) =>
  state.settings.uavs.takeoffHeadingAccuracy || 20;

/**
 * Returns the currently selected display language for the application.
 */
export const getDisplayLanguage = (state) => state.settings.display.language;

/**
 * Returns the name of the lighting conditions preset for the 3D view.
 */
export const getLightingConditionsForThreeDView = (state) => {
  const { scenery, lighting } = state.settings.threeD;

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
 * Returns the name of the scenery preset for the 3D view.
 */
export const getSceneryForThreeDView = (state) => {
  const result = state.settings.threeD.scenery;

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
  (state) => state.settings.uavs,
  ({ warnThreshold, goneThreshold, forgetThreshold, autoRemove }) => ({
    // Conversion from seconds to msec happens here. Use some sensible lower
    // limits.
    goneThreshold: Math.max(1000, goneThreshold * 1000),
    warnThreshold: Math.max(1000, warnThreshold * 1000),
    forgetThreshold: autoRemove
      ? Math.max(1000, forgetThreshold * 1000)
      : Number.POSITIVE_INFINITY,
  })
);

const DEFAULT_FILTER = [];
const DEFAULT_SORT = { key: UAVSortKey.DEFAULT, reverse: false };

/**
 * Returns the array of filters to apply for the list showing the UAVs.
 */
export const getUAVListFilters = (state) => {
  const result = state.settings.display?.uavListFilters;
  return result || DEFAULT_FILTER;
};

/**
 * Returns the current layout of the list showing the UAVs.
 */
export const getUAVListLayout = (state) => state.settings.display.uavListLayout;

/**
 * Returns the current primary orientation of the list or grid showing the UAVs.
 */
export const getUAVListOrientation = (state) =>
  getUAVListLayout(state) === 'grid' ? 'horizontal' : 'vertical';

/**
 * Returns the preferred sort order of the list showing the UAVs. This is the
 * _secondary_ sorting preference; the primary is whether to sort the UAVs by
 * UAV ID or mission ID first.
 *
 * The returned value is an object with two keys: <code>key</code>, which is
 * a value from the UAVSortKey enum, and <code>reverse</code>, which is
 * true if the UAVs are to be sorted in reverse order.
 */
export function getUAVListSortPreference(state) {
  const result = state.settings.display?.uavListSortPreference;
  return result || DEFAULT_SORT;
}

/**
 * Returns whether UAV operations dispatched from toolbars or buttons should
 * be confirmed by the user.
 */
export function getUAVOperationConfirmationStyle(state) {
  return (
    state.settings.uavs?.uavOperationConfirmationStyle ||
    UAVOperationConfirmationStyle.NEVER
  );
}

/**
 * Returns whether we are currently showing empty mission slots in the UAV list.
 */
export const isShowingEmptyMissionSlots = (state) =>
  !state.settings.display?.hideEmptyMissionSlots;

/**
 * Returns whether we are currently showing mission IDs on the screen
 * where possible.
 */
export const isShowingMissionIds = (state) =>
  state.settings.display?.showMissionIds;

/**
 * Returns whether the user is allowed to see experimental features that are
 * not ready for production use yet.
 */
export const areExperimentalFeaturesEnabled = (state) =>
  state.settings.display?.experimentalFeaturesEnabled;

/**
 * Returns whether the app should ask for a confirmation when performing a
 * UAV operation affecting the given UAVs.
 */
export function shouldConfirmUAVOperation(state, uavs, isBroadcast) {
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
export const shouldShowInactiveSegmentsOnDarkLCD = (state) =>
  state.settings.display?.hideInactiveSegmentsOnDarkLCD;

/**
 * Returns whether the application should be optimized for single UAV operation.
 */
export const shouldOptimizeForSingleUAV = (state) =>
  state.settings.display?.optimizeForSingleUAV;

/**
 * Returns whether the UI should be adjusted primarily for touch based input.
 */
export const shouldOptimizeUIForTouch = (state) =>
  state.settings.display?.optimizeUIForTouch;

/**
 * Returns an object mapping service identifiers to their API keys.
 */
export const getAPIKeys = createSelector(
  (state) => state.settings.apiKeys,
  (apiKeys) => {
    const result = {};
    for (const [key, value] of Object.entries({
      ...DefaultAPIKeys,
      ...apiKeys,
    })) {
      result[String(key).toUpperCase()] =
        String(value || DefaultAPIKeys[key]) || '';
    }

    return result;
  }
);
