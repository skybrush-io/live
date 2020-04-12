import { createSelector } from '@reduxjs/toolkit';

import { selectOrdered } from '~/utils/collections';

/**
 * Selector that calculates and caches the list of all the datasets that
 * we store in the state object, in exactly the same order as they should appear
 * on the UI.
 */
export const getDatasetsInOrder = createSelector(
  (state) => state.datasets,
  selectOrdered
);
