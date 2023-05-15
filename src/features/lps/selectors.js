import { createSelector } from '@reduxjs/toolkit';

import { selectOrdered } from '~/utils/collections';

/**
 * Selector that calculates and caches the list of all the local positioning
 * systems that we store in the state object, in exactly the same order as they
 * should appear on the UI.
 */
export const getLocalPositioningSystemsInOrder = createSelector(
  (state) => state.lps,
  selectOrdered
);

/**
 * Funciton that returns the name of the given LPS that should be shown to
 * the user on the UI.
 */
export const getLocalPositioningSystemDisplayName = (lps) =>
  (lps ? lps.name || lps.id : null) || 'Unnamed positioning system';
