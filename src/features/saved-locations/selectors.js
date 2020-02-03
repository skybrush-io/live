import { createSelector } from '@reduxjs/toolkit';

import { selectOrdered } from '~/utils/collections';

/**
 * Selector that calculates and caches the list of all the saved locations
 * in the state object, in exactly the same order as they should appear on
 * the UI.
 */
export const getSavedLocationsInOrder = createSelector(
  state => state.savedLocations,
  selectOrdered
);
