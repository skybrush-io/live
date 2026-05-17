import { createSelector } from '@reduxjs/toolkit';
import isNil from 'lodash-es/isNil';
import sum from 'lodash-es/sum';

import type { RootState } from '~/store/reducers';
import { type Identifier, selectOrdered } from '~/utils/collections';
import type { Latitude, Longitude, LonLat } from '~/utils/geography';
import type { AveragingResult } from './types';

/**
 * Selector that returns which UAVs have an active position averaging record
 * in the measurement-related state.
 */
export const getActiveUAVIdsBeingAveraged = createSelector(
  (state: RootState) => state.measurement.averagingResults,
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
export const getAllUAVIdsCurrentlyBeingAveragedEvenIfPaused = (
  state: RootState
): string[] => state.measurement.averagingResults.order;

/**
 * Selector that returns the current state of all averaging measurements,
 * in the order they should appear on the UI.
 */
export const getAveragingMeasurements = createSelector(
  (state: RootState) => state.measurement.averagingResults,
  selectOrdered
);

/**
 * Selector that returns a mapping that maps UAV IDs to the corresponding
 * averaging measurements.
 */
export const getAveragingMeasurementsById = (
  state: RootState
): Record<string, AveragingResult> => state.measurement.averagingResults.byId;

/**
 * Selector that returns the centroid of the averaged coordinates of the
 * given list of UAV IDs, or undefined if the list is empty.
 */
export const getAveragedCentroidOfUAVsById = (
  state: RootState,
  uavIds: Identifier[]
): LonLat | undefined => {
  const measurements = getAveragingMeasurementsById(state);
  const lats = [];
  const lons = [];

  for (const uavId of uavIds) {
    const measurement = measurements[uavId];
    if (
      measurement &&
      !isNil(measurement.mean.lat) &&
      !isNil(measurement.mean.lon)
    ) {
      lats.push(measurement.mean.lat);
      lons.push(measurement.mean.lon);
    }
  }

  if (lats.length > 0) {
    return [
      (sum(lons) / lons.length) as Longitude,
      (sum(lats) / lats.length) as Latitude,
    ];
  }

  return undefined;
};

/**
 * Selector that returns which UAVs are currently selected in the averaging
 * measurements dialog box.
 */
export const getSelectedUAVIdsForAveragingMeasurement = (
  state: RootState
): string[] => state.measurement.averagingDialog.selectedUAVIds;

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
  getAveragingMeasurementsById,
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
