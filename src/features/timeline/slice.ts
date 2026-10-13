/**
 * @file Slice of the state object that stores the configuration of the
 * timeline chart (the visible datasets and marker lanes).
 */

import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { EMPTY_CHART } from './model';
import type { TimelineChartConfig } from './types';

export type TimelineSliceState = {
  chart: TimelineChartConfig;
};

const initialState: TimelineSliceState = {
  chart: EMPTY_CHART,
};

const { actions, reducer } = createSlice({
  name: 'timeline',
  initialState,
  reducers: {
    setChartConfig(state, { payload }: PayloadAction<TimelineChartConfig>) {
      state.chart = payload;
    },
  },
});

export const { setChartConfig } = actions;

export default reducer;
