import { createSelector } from '@reduxjs/toolkit';

import { globalIdToBeaconId } from '~/model/identifiers';
import { selectionForSubset } from '~/selectors/selection';
import type { RootState } from '~/store/reducers';
import type { Beacon } from './types';
import { selectOrdered } from '~/utils/collections';

/**
 * Selector that calculates and caches the list of all the beacons that
 * we store in the state object, in exactly the same order as they should appear
 * on the UI.
 */
export const getBeaconsInOrder = createSelector(
  (state: RootState) => state.beacons,
  selectOrdered
);

/**
 * Selector that calculates and caches the list of selected beacon IDs
 * from the state object.
 */
export const getSelectedBeaconIds = selectionForSubset(globalIdToBeaconId);

/**
 * Funciton that returns the name of the given beacon that should be shown to
 * the user on the UI.
 */
export const getBeaconDisplayName = (beacon: Beacon) =>
  (beacon ? beacon.name || beacon.id : null) || 'Unnamed beacon';

/**
 * Selector that returns the IDs of all the beacons that have no basic
 * information fetched from the server yet.
 */
export const getBeaconIdsWithoutBasicInformation = createSelector(
  (state: RootState) => state.beacons,
  (beacons) => {
    const result = [];

    for (const [key, value] of Object.entries(beacons.byId)) {
      if (typeof value.name === 'undefined') {
        result.push(key);
      }
    }

    return result;
  }
);
