import { createSelector } from '@reduxjs/toolkit';

import { globalIdToDockId } from '~/model/identifiers';
import { selectionForSubset } from '~/selectors/selection';
import { selectOrdered } from '~/utils/collections';

/**
 * Selector that calculates and caches the list of all the docking stations that
 * we store in the state object, in exactly the same order as they should appear
 * on the UI.
 */
export const getDocksInOrder = createSelector(
  (state) => state.docks,
  selectOrdered
);

/**
 * Selector that calculates and caches the list of selected docking station
 * IDs from the state object.
 */
export const getSelectedDockIds = selectionForSubset(globalIdToDockId);
