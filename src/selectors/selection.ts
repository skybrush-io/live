/**
 * @file Selectors that are related to the currently selected objects on
 * the map.
 */

import OLCollection from 'ol/Collection';
import { createSelector } from '@reduxjs/toolkit';

import { globalIdToOriginId } from '~/model/identifiers';
import { type AppSelector } from '~/store/reducers';
import { rejectNullish } from '~/utils/arrays';
import { type Identifier } from '~/utils/collections';

/**
 * Selector that retrieves the list of item IDs in the current selection
 * from the state object.
 *
 * @param state - The state of the application
 * @returns The list of selected item IDs
 */
export const getSelection: AppSelector<Identifier[]> = (state) =>
  state.map.selection;

/**
 * Selector factory that creates a selector that returns true if and only if a
 * feature with the given ID is selected.
 */
export const isSelected = (id: Identifier): AppSelector<boolean> =>
  createSelector(getSelection, (selection) => selection.includes(id));

/**
 * Helper function that creates a selector that maps the current map selection
 * to a subset of the IDs based on a mapping function from global IDs.
 *
 * @param mapper - A function that takes a global ID as an input argument
 *                 and returns undefined if and only if the global ID is
 *                 not part of the subset being selected
 * @returns A selector function
 */
export const selectionForSubset = (
  mapper: (globalId: Identifier) => Identifier | undefined
): AppSelector<Identifier[]> =>
  createSelector(getSelection, (selection) =>
    rejectNullish(selection.map(mapper))
  );

const _selectedFeatureIdsOLCollection = new OLCollection<Identifier>([], {
  unique: true,
});

/**
 * Selector that retrieves an OpenLayers collection containing the list of
 * selected feature IDs from the state object.
 *
 * The selector will always return the *same* OpenLayers collection instance,
 * but it will update the contents of the collection when the selection
 * changes. It is the responsibility of components using this collection
 * to listen for the appropriate events dispatched by the collection.
 * @param state - The state of the application
 * @returns The collection of selected feature IDs
 */
export const getSelectedFeatureIdsAsOpenLayersCollection: AppSelector<
  OLCollection<Identifier>
> = createSelector(getSelection, (selection) => {
  _selectedFeatureIdsOLCollection.clear();
  _selectedFeatureIdsOLCollection.extend(selection);
  return _selectedFeatureIdsOLCollection;
});

/**
 * Selector that retrieves the list of selected coordinate system origin IDs
 * from the state object.
 *
 * @param state - The state of the application
 * @returns The list of selected origin IDs
 */
export const getSelectedOriginIds = selectionForSubset(globalIdToOriginId);
