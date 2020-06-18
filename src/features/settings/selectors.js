import { createSelector } from '@reduxjs/toolkit';

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
