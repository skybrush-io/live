import { createSelector } from '@reduxjs/toolkit';

import { globalIdToBeaconId } from '~/model/identifiers';
import { selectionForSubset } from '~/selectors/selection';
import { type AppSelector } from '~/store/reducers';
import {
  type Collection,
  type Identifier,
  selectOrdered,
} from '~/utils/collections';

import type { Beacon } from './types';

/**
 * Selector that returns the collection of beacons, that is a list of beacon IDs
 * together with a mapping from these IDs to the information stored about them.
 */
export const getBeaconsAsCollection: AppSelector<Collection<Beacon>> = (
  state
) => state.beacons;

/**
 * Selector that calculates and caches the list of all the beacons that
 * we store in the state object, in exactly the same order as they should appear
 * on the UI.
 */
export const getBeaconsInOrder: AppSelector<Beacon[]> = createSelector(
  getBeaconsAsCollection,
  selectOrdered
);

/**
 * Selector that calculates and caches the list of selected beacon IDs
 * from the state object.
 */
export const getSelectedBeaconIds: AppSelector<Identifier[]> =
  selectionForSubset(globalIdToBeaconId);

/**
 * Funciton that returns the name of the given beacon that should be shown to
 * the user on the UI.
 */
export const getBeaconDisplayName = (beacon: Beacon): string =>
  beacon?.name ?? beacon?.id ?? 'Unnamed beacon';

/**
 * Selector that returns the IDs of all the beacons that have no basic
 * information fetched from the server yet.
 */
export const getBeaconIdsWithoutBasicInformation: AppSelector<Identifier[]> =
  createSelector(getBeaconsAsCollection, (beacons) => {
    const result = [];

    for (const [key, value] of Object.entries(beacons.byId)) {
      if (value.name === undefined) {
        result.push(key);
      }
    }

    return result;
  });
