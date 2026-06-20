import type { ActionCreatorWithPayload } from '@reduxjs/toolkit';
import copy from 'copy-to-clipboard';
import isNil from 'lodash-es/isNil';

import { setFlatEarthCoordinateSystemOrigin } from '~/features/map/origin';
import { showError, showNotification } from '~/features/snackbar/actions';
import { getPreferredCoordinateFormatter } from '~/selectors/formatting';
import type { AppThunk } from '~/store/reducers';

import {
  getAllUAVIdsCurrentlyBeingAveragedEvenIfPaused,
  getAveragedCentroidOfUAVsById,
  getSelectedUAVIdsForAveragingMeasurement,
} from './selectors';
import {
  pauseAveragingUAVCoordinatesByIds,
  restartAveragingUAVCoordinatesByIds,
  resumeAveragingUAVCoordinatesByIds,
  stopAveragingUAVCoordinatesByIds,
  updateAveragingByIds,
} from './slice';
import type { AveragingResult } from './types';

/**
 * Helper function that converts an action factory with a single argument
 * consisting of UAV IDs to another action factory that takes no arguments
 * and always acts on the current selection.
 */
const applyToSelection =
  (
    actionFactory:
      | ActionCreatorWithPayload<string[]>
      | ((uavIds: string[]) => AppThunk),
    { whenEmpty = 'nop' }: { whenEmpty?: 'nop' | 'useAll' } = {}
  ) =>
  (): AppThunk =>
  (dispatch, getState) => {
    const state = getState();

    let selectedUAVIds = getSelectedUAVIdsForAveragingMeasurement(state);

    if (
      (!selectedUAVIds || selectedUAVIds.length === 0) &&
      whenEmpty === 'useAll'
    ) {
      selectedUAVIds = getAllUAVIdsCurrentlyBeingAveragedEvenIfPaused(state);
    }

    if (selectedUAVIds && selectedUAVIds.length > 0) {
      dispatch(actionFactory(selectedUAVIds));
    }
  };

/**
 * Pauses averaging for all the UAVs that are currently selected, but keeps the
 * results. Falls back to all UAVs if nothing is selected.
 */
export const pauseAveragingSelectedUAVs = applyToSelection(
  pauseAveragingUAVCoordinatesByIds,
  { whenEmpty: 'useAll' }
);

/**
 * Restarts averaging for all the UAVs that are currently selected. Falls back
 * to all UAVs if nothing is selected.
 */
export const restartAveragingSelectedUAVs = applyToSelection(
  restartAveragingUAVCoordinatesByIds
);

/**
 * Resumes averaging for all the UAVs that are currently selected. Falls back to
 * all UAVs if nothing is selected.
 */
export const resumeAveragingSelectedUAVs = applyToSelection(
  resumeAveragingUAVCoordinatesByIds,
  { whenEmpty: 'useAll' }
);

/**
 * Stops averaging for all the UAVs that are currently selected and removes them
 * from the display. Does nothing if the selection is empty.
 */
export const stopAveragingSelectedUAVs = applyToSelection(
  stopAveragingUAVCoordinatesByIds
);

type SampleKeys = 'lat' | 'lon' | 'amsl' | 'ahl';

/**
 * Adds new samples to the averaging process of multiple UAVs.
 */
export const addNewSamplesToAveraging =
  (samples: Record<string, AveragingResult['mean']>): AppThunk =>
  (dispatch, getState) => {
    const state = getState();
    const keys: SampleKeys[] = ['lat', 'lon', 'amsl', 'ahl'] as const;
    const updates: Record<
      AveragingResult['id'],
      Omit<AveragingResult, 'id'>
    > = {};

    for (const [uavId, sample] of Object.entries(samples)) {
      const averagingState = state.measurement.averagingResults.byId[uavId];
      const newCount = averagingState.numSamples + 1;

      if (averagingState) {
        updates[uavId] = {
          lastSampleAt: Date.now(),
          numSamples: newCount,
          mean: {} as any,
          sqDiff: {} as any,
        } as Omit<AveragingResult, 'id'>;
        for (const key of keys) {
          if (!isNil(sample[key])) {
            const difference = sample[key] - averagingState.mean[key];
            const newMean = averagingState.mean[key] + difference / newCount;
            const sqDiffIncrement = (sample[key] - newMean) * difference;
            const newSqDiff = averagingState.sqDiff[key] + sqDiffIncrement;
            updates[uavId].mean[key] = newMean as any;
            updates[uavId].sqDiff[key] = newSqDiff as any;
          }
        }
      }
    }

    dispatch(updateAveragingByIds(updates));
  };

/**
 * Copies the coordinates of the centroid of a given set of UAV IDs to the
 * clipboard.
 */
export const copyCentroidOfAveragedCoordinatesToClipboard =
  (uavIds: string[]): AppThunk =>
  async (_dispatch, getState) => {
    const state = getState();
    const centroid = getAveragedCentroidOfUAVsById(state, uavIds);

    if (centroid) {
      const formatter = getPreferredCoordinateFormatter(state);
      const formattedCoords = formatter(centroid);
      const success = await copy(formattedCoords);

      if (!success) {
        showError('Failed to copy coordinates to clipboard.');
      } else if (uavIds.length === 1) {
        showNotification('Coordinates copied to clipboard.');
      } else {
        showNotification('Coordinates of centroid copied to clipboard.');
      }
    }
  };

export const copyAveragedCentroidOfSelectedUAVsToClipboard = applyToSelection(
  copyCentroidOfAveragedCoordinatesToClipboard,
  { whenEmpty: 'useAll' }
);

/**
 * Sets the map origin to the centroid of the given set of UAV IDs.
 */
export const setCentroidOfAveragedCoordinatesAsMapOrigin =
  (uavIds: string[]): AppThunk =>
  (dispatch, getState) => {
    const centroid = getAveragedCentroidOfUAVsById(getState(), uavIds);

    if (centroid) {
      dispatch(setFlatEarthCoordinateSystemOrigin(centroid));
      if (uavIds.length === 1) {
        showNotification(
          'Map origin set to the coordinates of the selected UAV.'
        );
      } else {
        showNotification('Map origin set to centroid of selection.');
      }
    }
  };

export const setAveragedCentroidOfSelectedUAVsAsMapOrigin = applyToSelection(
  setCentroidOfAveragedCoordinatesAsMapOrigin,
  { whenEmpty: 'useAll' }
);
