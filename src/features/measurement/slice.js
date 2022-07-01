/**
 * @file Slice of the state object that keeps track of coordinate averaging and
 * other measurements that the app allows to perform on the UAVs.
 */

import { createSlice } from '@reduxjs/toolkit';
import intersection from 'lodash-es/intersection';

import {
  addItemSortedUnlessExists,
  deleteItemsByIds,
} from '~/utils/collections';
import { noPayload } from '~/utils/redux';

const { actions, reducer } = createSlice({
  name: 'measurement',

  initialState: {
    // Object containing the state of all the coordinate averaging measurements
    // being performed
    averagingResults: {
      byId: {
        /* The shape of a single result item looks like this:

        {
          "id": "47",
          "startedAt": 12323532726      // Unix timestamp, milliseconds
          "lastSampleAt": 12323542726   // Unix timestamp, milliseconds
          "extraSamplingTime": 0,       // milliseconds
          "numSamples": 100,
          "mean": {
            "lat": 47,
            "lon": 19,
            "amsl": 123,
            "dist": 1.2
          },
          "sqDiff": { ...}
        }

        */
      },
      order: [],
    },

    averagingDialog: {
      mode: 'normal',
      open: false,
      selectedUAVIds: [],
    },
  },

  reducers: {
    closeAveragingDialog: noPayload((state) => {
      state.averagingDialog.open = false;
    }),

    showAveragingDialog: noPayload((state) => {
      state.averagingDialog.open = true;
    }),

    startAddingNewAveragingMeasurement: noPayload((state) => {
      state.averagingDialog.mode = 'adding';
    }),

    finishAddingNewAveragingMeasurement: noPayload((state) => {
      state.averagingDialog.mode = 'normal';
    }),

    setSelectedUAVIdsForAveragingMeasurement(state, action) {
      state.averagingDialog.selectedUAVIds = [...action.payload];
    },

    startAveragingUAVCoordinateById(state, action) {
      const uavId = action.payload;

      addItemSortedUnlessExists(state.averagingResults, {
        id: uavId,
        startedAt: Date.now(),
        lastSampleAt: null,
        numSamples: 0,
        extraSamplingTime: 0,
        sampling: true,
        mean: {
          lat: 0,
          lon: 0,
          amsl: 0,
          agl: 0,
        },
        sqDiff: {
          lat: 0,
          lon: 0,
          amsl: 0,
          agl: 0,
        },
      });
    },

    pauseAveragingUAVCoordinatesByIds(state, action) {
      const uavIds = action.payload;
      const results = state.averagingResults;

      for (const uavId of uavIds) {
        const item = results.byId[uavId];
        if (item) {
          item.sampling = false;
          item.extraSamplingTime += Date.now() - item.startedAt;
          item.startedAt = null;
          item.lastSampleAt = null;
        }
      }
    },

    restartAveragingUAVCoordinatesByIds(state, action) {
      const uavIds = action.payload;
      const results = state.averagingResults;

      for (const uavId of uavIds) {
        if (results.byId[uavId]) {
          results.byId[uavId] = {
            ...results.byId[uavId],
            startedAt: Date.now(),
            lastSampleAt: null,
            numSamples: 0,
            extraSamplingTime: 0,
            sampling: true,
            mean: {
              lat: 0,
              lon: 0,
              amsl: 0,
              agl: 0,
            },
            sqDiff: {
              lat: 0,
              lon: 0,
              amsl: 0,
              agl: 0,
            },
          };
        }
      }
    },

    resumeAveragingUAVCoordinatesByIds(state, action) {
      const uavIds = action.payload;
      const results = state.averagingResults;

      for (const uavId of uavIds) {
        if (results.byId[uavId]) {
          results.byId[uavId].sampling = true;
          results.byId[uavId].startedAt = Date.now();
        }
      }
    },

    stopAveragingUAVCoordinatesByIds(state, action) {
      const uavIds = action.payload;

      deleteItemsByIds(state.averagingResults, uavIds);

      state.averagingDialog.selectedUAVIds = intersection(
        state.averagingDialog.selectedUAVIds,
        state.averagingResults.order
      );
    },

    updateAveragingByIds(state, action) {
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
  finishAddingNewAveragingMeasurement,
  pauseAveragingUAVCoordinatesByIds,
  restartAveragingUAVCoordinatesByIds,
  resumeAveragingUAVCoordinatesByIds,
  setSelectedUAVIdsForAveragingMeasurement,
  showAveragingDialog,
  startAddingNewAveragingMeasurement,
  startAveragingUAVCoordinateById,
  stopAveragingUAVCoordinatesByIds,
  updateAveragingByIds,
} = actions;

export default reducer;
