import copy from 'copy-to-clipboard';
import isNil from 'lodash-es/isNil';
import sum from 'lodash-es/sum';

import {
  getAllUAVIdsCurrentlyBeingAveragedEvenIfPaused,
  getSelectedUAVIdsForAveragingMeasurement,
} from './selectors';
import {
  pauseAveragingUAVCoordinatesByIds,
  restartAveragingUAVCoordinatesByIds,
  resumeAveragingUAVCoordinatesByIds,
  stopAveragingUAVCoordinatesByIds,
  updateAveragingByIds,
} from './slice';

import { showNotification } from '~/features/snackbar/slice';
import { getPreferredCoordinateFormatter } from '~/selectors/formatting';

/**
 * Helper function that converts an action factory with a single argument
 * consisting of UAV IDs to another action factory that takes no arguments
 * and always acts on the current selection.
 */
const applyToSelection = (actionFactory, { whenEmpty = 'nop' } = {}) => () => (
  dispatch,
  getState
) => {
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

/**
 * Adds new samples to the averaging process of multiple UAVs.
 */
export const addNewSamplesToAveraging = (samples) => (dispatch, getState) => {
  const state = getState();
  const keys = ['lat', 'lon', 'amsl', 'agl'];
  const updates = {};

  for (const [uavId, sample] of Object.entries(samples)) {
    const averagingState = state.measurement.averagingResults.byId[uavId];
    const newCount = averagingState.numSamples + 1;

    if (averagingState) {
      updates[uavId] = {
        lastSampleAt: Date.now(),
        numSamples: newCount,
        mean: {},
        sqDiff: {},
      };
      for (const key of keys) {
        if (!isNil(sample[key])) {
          const difference = sample[key] - averagingState.mean[key];
          const newMean = averagingState.mean[key] + difference / newCount;
          const sqDiffIncrement = (sample[key] - newMean) * difference;
          const newSqDiff = averagingState.sqDiff[key] + sqDiffIncrement;
          updates[uavId].mean[key] = newMean;
          updates[uavId].sqDiff[key] = newSqDiff;
        }
      }
    }
  }

  dispatch(updateAveragingByIds(updates));
};

/**
 * Copies the coordinates of the centroid of the selection to the clipboard.
 */
export const copyCentroidOfAveragedCoordinatesToClipboard = (uavIds) => (
  dispatch,
  getState
) => {
  const lats = [];
  const lons = [];
  const state = getState();
  const measurements = state.measurement.averagingResults.byId;

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
    const formatter = getPreferredCoordinateFormatter(state);
    const formattedCoords = formatter([
      sum(lons) / lons.length,
      sum(lats) / lats.length,
    ]);
    copy(formattedCoords);

    if (lats.length === 1) {
      dispatch(showNotification('Coordinates copied to clipboard.'));
    } else {
      dispatch(
        showNotification('Coordinates of centroid copied to clipboard.')
      );
    }
  }
};

export const copyAveragedCentroidOfSelectedUAVsToClipboard = applyToSelection(
  copyCentroidOfAveragedCoordinatesToClipboard
);
