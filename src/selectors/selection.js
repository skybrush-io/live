/**
 * @file Selectors that are related to the currently selected objects on
 * the map.
 */

import isNil from 'lodash-es/isNil';
import reject from 'lodash-es/reject';
import Collection from 'ol/Collection';
import { createSelector } from '@reduxjs/toolkit';

import { globalIdToOriginId } from '~/model/identifiers';

/**
 * Selector that retrieves the list of item IDs in the current selection
 * from the state object.
 *
 * @param  {Object}  state  the state of the application
 * @return {string[]}  the list of selected item IDs
 */
export const getSelection = (state) => state.map.selection;

/**
 * Selector factory that creates a selector that returns true if and only if a
 * feature with the given ID is selected.
 */
export const isSelected = (id) =>
  createSelector(getSelection, (selection) => selection.includes(id));

/**
 * Helper function that creates a selector that maps the current map selection
 * to a subset of the IDs based on a mapping function from global IDs.
 *
 * @param {function} mapper  a function that takes a global ID as an input
 *        argument and returns null or undefined if and only if the global ID
 *        is not part of the subset being selected
 * @return {function} a selector function
 */
export const selectionForSubset = (mapper) =>
  createSelector(getSelection, (selection) =>
    reject(selection.map(mapper), isNil)
  );

const _selectedFeatureIdsCollection = new Collection([], { unique: true });

/**
 * Selector that retrieves an OpenLayers collection containing the list of
 * selected feature IDs from the state object.
 *
 * The selector will always return the *same* OpenLayers collection instance,
 * but it will update the contents of the collection when the selection
 * changes. It is the responsibility of components using this collection
 * to listen for the appropriate events dispatched by the collection.
 * @param  {Object}  state  the state of the application
 * @return {string[]}  the list of selected feature IDs
 */
export const getSelectedFeatureIdsAsOpenLayersCollection = createSelector(
  getSelection,
  (selection) => {
    _selectedFeatureIdsCollection.clear();
    _selectedFeatureIdsCollection.extend(selection);
    return _selectedFeatureIdsCollection;
  }
);

/**
 * Selector that retrieves the list of selected coordinate system origin IDs
 * from the state object.
 *
 * @param  {Object}  state  the state of the application
 * @return {string[]}  the list of selected feature IDs
 */
export const getSelectedOriginIds = selectionForSubset(globalIdToOriginId);
