/**
 * @file Slice of the state object that keeps track of coordinate averaging and
 * other measurements that the app allows to perform on the UAVs.
 */

import intersection from 'lodash-es/intersection';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type ReadonlyDeep } from 'type-fest';

import {
  addItemSortedUnlessExists,
  type Collection,
  deleteItemsByIds,
  EMPTY_COLLECTION,
} from '~/utils/collections';
import { noPayload } from '~/utils/redux';

import { type AveragingResult } from './types';

type MeasurementSliceState = ReadonlyDeep<{
  /**
   * Object containing the state of all the coordinate averaging measurements
   * being performed
   */
  averagingResults: Collection<AveragingResult>;

  averagingDialog: {
    open: boolean;
    selectedUAVIds: Array<AveragingResult['id']>;
  };
}>;

const initialState: MeasurementSliceState = {
  averagingResults: EMPTY_COLLECTION,

  averagingDialog: {
    open: false,
    selectedUAVIds: [],
  },
};

const { actions, reducer } = createSlice({
  name: 'measurement',
  initialState,
  reducers: {
    closeAveragingDialog: noPayload<MeasurementSliceState>((state) => {
      state.averagingDialog.open = false;
    }),

    showAveragingDialog: noPayload<MeasurementSliceState>((state) => {
      state.averagingDialog.open = true;
    }),

    setSelectedUAVIdsForAveragingMeasurement(
      state,
      action: PayloadAction<Array<AveragingResult['id']>>
    ) {
      state.averagingDialog.selectedUAVIds = [...action.payload];
    },

    startAveragingUAVCoordinateById(
      state,
      action: PayloadAction<AveragingResult['id']>
    ) {
      const uavId = action.payload;

      addItemSortedUnlessExists<AveragingResult>(state.averagingResults, {
        id: uavId,
        startedAt: Date.now(),
        lastSampleAt: undefined,
        numSamples: 0,
        extraSamplingTime: 0,
        sampling: true,
        mean: { lat: 0, lon: 0, amsl: 0, ahl: 0 },
        sqDiff: { lat: 0, lon: 0, amsl: 0, ahl: 0 },
      });
    },

    pauseAveragingUAVCoordinatesByIds(
      state,
      action: PayloadAction<AveragingResult['id']>
    ) {
      const uavIds = action.payload;
      const results = state.averagingResults;

      for (const uavId of uavIds) {
        const item = results.byId[uavId];
        if (item && typeof item.startedAt === 'number') {
          item.sampling = false;
          item.extraSamplingTime += Date.now() - item.startedAt;
          item.startedAt = undefined;
          item.lastSampleAt = undefined;
        }
      }
    },

    restartAveragingUAVCoordinatesByIds(
      state,
      action: PayloadAction<AveragingResult['id']>
    ) {
      const uavIds = action.payload;
      const results = state.averagingResults;

      for (const uavId of uavIds) {
        const result = results.byId[uavId];
        if (result) {
          results.byId[uavId] = {
            ...result,
            startedAt: Date.now(),
            lastSampleAt: undefined,
            numSamples: 0,
            extraSamplingTime: 0,
            sampling: true,
            mean: { lat: 0, lon: 0, amsl: 0, ahl: 0 },
            sqDiff: { lat: 0, lon: 0, amsl: 0, ahl: 0 },
          };
        }
      }
    },

    resumeAveragingUAVCoordinatesByIds(
      state,
      action: PayloadAction<Array<AveragingResult['id']>>
    ) {
      const uavIds = action.payload;

      for (const uavId of uavIds) {
        const result = state.averagingResults.byId[uavId];
        if (result) {
          result.sampling = true;
          result.startedAt = Date.now();
        }
      }
    },

    stopAveragingUAVCoordinatesByIds(
      state,
      action: PayloadAction<Array<AveragingResult['id']>>
    ) {
      const uavIds = action.payload;

      deleteItemsByIds(state.averagingResults, uavIds);

      state.averagingDialog.selectedUAVIds = intersection(
        state.averagingDialog.selectedUAVIds,
        state.averagingResults.order
      );
    },

    updateAveragingByIds(
      state,
      action: PayloadAction<
        Record<AveragingResult['id'], Omit<AveragingResult, 'id'>>
      >
    ) {
      for (const [uavId, updates] of Object.entries(action.payload)) {
        const item = state.averagingResults.byId[uavId];
        if (item) {
          item.mean = { ...item.mean, ...updates.mean };
          item.sqDiff = { ...item.sqDiff, ...updates.sqDiff };

          if (updates.numSamples !== undefined) {
            item.numSamples = updates.numSamples;
          }

          if (updates.lastSampleAt !== undefined) {
            item.lastSampleAt = updates.lastSampleAt;
          }
        }
      }
    },
  },
});

export const {
  closeAveragingDialog,
  pauseAveragingUAVCoordinatesByIds,
  restartAveragingUAVCoordinatesByIds,
  resumeAveragingUAVCoordinatesByIds,
  setSelectedUAVIdsForAveragingMeasurement,
  showAveragingDialog,
  startAveragingUAVCoordinateById,
  stopAveragingUAVCoordinatesByIds,
  updateAveragingByIds,
} = actions;

export default reducer;
