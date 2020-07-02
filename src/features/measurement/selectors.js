import { createSelector } from '@reduxjs/toolkit';

import { selectOrdered } from '~/utils/collections';

/**
 * Selector that returns which UAVs have an active position averaging record
 * in the measurement-related state.
 */
export const getActiveUAVIdsBeingAveraged = createSelector(
  (state) => state.measurement.averagingResults,
  ({ byId, order }) => {
    const result = [];

    for (const uavId of order) {
      if (byId[uavId] && byId[uavId].sampling) {
        result.push(uavId);
      }
    }

    return result;
  }
);

/**
 * Selector that returns all UAV IDs whose position is currently being averaged.
 */
export const getAllUAVIdsCurrentlyBeingAveragedEvenIfPaused = (state) =>
  state.measurement.averagingResults.order;

/**
 * Selector that returns the current state of all averaging measurements,
 * in the order they should appear on the UI.
 */
export const getAveragingMeasurements = createSelector(
  (state) => state.measurement.averagingResults,
  selectOrdered
);

/**
 * Selector that returns which UAVs are currently selected in the averaging
 * measurements dialog box.
 */
export const getSelectedUAVIdsForAveragingMeasurement = (state) =>
  state.measurement.averagingDialog.selectedUAVIds;

/**
 * Selector that returns whether there are any UAVs being measured in the
 * averaging measurements dialog box, even if these measurements are paused.
 */
export const hasActiveOrPausedAveragingMeasurements = createSelector(
  getAllUAVIdsCurrentlyBeingAveragedEvenIfPaused,
  (uavIds) => uavIds && uavIds.length > 0
);

/**
 * Selector that returns whether there are any UAVs being measured in the
 * averaging measurements dialog box, _without_ the ones that are paused.
 */
export const hasActiveAveragingMeasurements = createSelector(
  getAllUAVIdsCurrentlyBeingAveragedEvenIfPaused,
  (state) => state.measurement.averagingResults.byId,
  (uavIds, measurementsById) => {
    for (const uavId of uavIds) {
      if (
        measurementsById &&
        measurementsById[uavId] &&
        measurementsById[uavId].sampling
      ) {
        return true;
      }
    }

    return false;
  }
);

/**
 * Selector that returns whether there are any UAVs selected in the averaging
 * measurements dialog box.
 */
export const hasSelectionInAveragingMeasurementDialogBox = createSelector(
  getSelectedUAVIdsForAveragingMeasurement,
  (selectedUAVIds) => selectedUAVIds && selectedUAVIds.length > 0
);
