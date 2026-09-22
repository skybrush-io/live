import { createSelector } from '@reduxjs/toolkit';

import type { RootState } from '~/store/reducers';
import { selectOrdered } from '~/utils/collections';

import type { Clock, ClockWithUpdateInterval } from './types';
import { getPreferredUpdateIntervalOfClock } from './utils';

/**
 * Returns a single clock object by its ID.
 */
export const getClockById = (state: RootState, id: string) =>
  state.clocks.byId[id];

/**
 * Returns a single clock object by its ID, augmented with its preferred
 * update interval.
 */
export const getClockAndUpdateIntervalById = (
  state: RootState,
  id: string
): ClockWithUpdateInterval | undefined => {
  const clock = state.clocks.byId[id];
  return clock
    ? {
        ...clock,
        updateInterval: getPreferredUpdateIntervalOfClock(clock),
      }
    : undefined;
};

/**
 * Selector that calculates and caches the list of all the clocks that
 * the upstream server maintains, in exactly the same order as they should
 * appear on the UI.
 */
export const getClocksInOrder = createSelector(
  (state: RootState) => state.clocks,
  selectOrdered<Clock>
);

/**
 * Selector that takes the clocks in the order they should be shown on the
 * UI, and extends then with the preferred update intervals, calculated from
 * the number of ticks per second.
 */
export const getClocksWithUpdateIntervalsInOrder = createSelector(
  getClocksInOrder,
  (clocks): ClockWithUpdateInterval[] =>
    clocks.map((clock) => ({
      ...clock,
      updateInterval: getPreferredUpdateIntervalOfClock(clock),
    }))
);
