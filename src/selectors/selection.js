/**
 * @file Selectors that are related to the currently selected objects on
 * the map.
 */

import { isNil, reject } from 'lodash';
import Collection from 'ol/Collection';
import { createSelector } from 'reselect';

import {
  globalIdToFeatureId,
  globalIdToHomePositionId,
  globalIdToUavId
} from '../model/identifiers';

/**
 * Selector that retrieves the list of item IDs in the current selection
 * from the state object.
 *
 * @param  {Object}  state  the state of the application
 * @return {string[]}  the list of selected item IDs
 */
export const getSelection = state => state.map.selection;

/**
 * Helper function that creates a selector that maps the current map selection
 * to a subset of the IDs based on a mapping function from global IDs.
 *
 * @param {function} mapper  a function that takes a global ID as an input
 *        argument and returns null or undefined if and only if the global ID
 *        is not part of the subset being selected
 * @return {function} a selector function
 */
const selectionForSubset = mapper =>
  createSelector(
    getSelection,
    selection => reject(selection.map(mapper), isNil)
  );

/**
 * Selector that retrieves the list of selected feature IDs from the
 * state object.
 *
 * @param  {Object}  state  the state of the application
 * @return {string[]}  the list of selected feature IDs
 */
export const getSelectedFeatureIds = selectionForSubset(globalIdToFeatureId);

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
  selection => {
    _selectedFeatureIdsCollection.clear();
    _selectedFeatureIdsCollection.extend(selection);
    return _selectedFeatureIdsCollection;
  }
);

/**
 * Selector that retrieves the list of the labels of the selected features
 * from the state object.
 *
 * @param  {Object}  state  the state of the application
 * @return {string[]}  the list of selected feature labels
 */
export const getSelectedFeatureLabels = createSelector(
  getSelectedFeatureIds,
  state => state.features.byId,
  (featureIds, features) =>
    reject(featureIds.map(featureId => features[featureId]), isNil).map(
      feature => feature.label
    )
);

/**
 * Selector that retrieves the list of selected home position IDs from the
 * state object.
 *
 * @param  {Object}  state  the state of the application
 * @return {string[]}  the list of selected feature IDs
 */
export const getSelectedHomePositionIds = selectionForSubset(
  globalIdToHomePositionId
);

/**
 * Selector that calculates and caches the list of selected UAV IDs from
 * the state object.
 */
export const getSelectedUAVIds = selectionForSubset(globalIdToUavId);
