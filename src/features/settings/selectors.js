import { createSelector } from '@reduxjs/toolkit';

import {
  DEFAULT_BATTERY_CELL_COUNT,
  LIPO_CRITICAL_VOLTAGE_THRESHOLD,
  LIPO_FULL_CHARGE_VOLTAGE,
  LIPO_LOW_VOLTAGE_THRESHOLD,
} from '~/model/constants';

/**
 * Returns an object that is suitable to be used for the `settings` prop of a
 * BatteryIndicator component to describe what the various charge thresholds are
 * and how many cells there are in a typical battery.
 */
export const getBatteryIndicatorSettings = createSelector(
  (state) => state.settings.uavs,
  ({
    defaultBatteryCellCount = DEFAULT_BATTERY_CELL_COUNT,
    fullChargeVoltage = LIPO_FULL_CHARGE_VOLTAGE,
    lowVoltageThreshold = LIPO_LOW_VOLTAGE_THRESHOLD,
    criticalVoltageThreshold = LIPO_CRITICAL_VOLTAGE_THRESHOLD,
  } = {}) => ({
    defaultCellCount: defaultBatteryCellCount,
    voltageThresholds: {
      full: fullChargeVoltage,
      nearFull:
        fullChargeVoltage - (fullChargeVoltage - lowVoltageThreshold) * 0.1,
      ok: fullChargeVoltage - (fullChargeVoltage - lowVoltageThreshold) * 0.4,
      warning: lowVoltageThreshold,
      critical: criticalVoltageThreshold,
    },
  })
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
 * be marked as inactive, gone or forgotten.
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

/**
 * Returns the current layout of the list showing the UAVs.
 */
export const getUAVListLayout = (state) => state.settings.display.uavListLayout;

/**
 * Returns whether we are currently showing mission IDs on the screen
 * where possible.
 */
export const isShowingMissionIds = (state) =>
  state.settings.display.showMissionIds;
