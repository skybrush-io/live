import { createSelector } from '@reduxjs/toolkit';

import { getPreferredUpdateIntervalOfClock } from './utils';
import { selectOrdered } from '~/utils/collections';

/**
 * Selector that calculates and caches the list of all the clocks that
 * the upstream server maintains, in exactly the same order as they should
 * appear on the UI.
 */
export const getClocksInOrder = createSelector(
  state => state.clocks,
  selectOrdered
);

/**
 * Selector that takes the clocks in the order they should be shown on the
 * UI, and extends then with the preferred update intervals, calculated from
 * the number of ticks per second.
 */
export const getClocksWithUpdateIntervalsInOrder = createSelector(
  getClocksInOrder,
  clocks =>
    clocks.map(clock => ({
      ...clock,
      updateInterval: getPreferredUpdateIntervalOfClock(clock)
    }))
);
