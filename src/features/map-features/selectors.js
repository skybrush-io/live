import camelCase from 'lodash-es/camelCase';
import capitalize from 'lodash-es/capitalize';
import isNil from 'lodash-es/isNil';
import map from 'lodash-es/map';
import reject from 'lodash-es/reject';

import { createSelector } from '@reduxjs/toolkit';

import { getSelectedTool } from '~/features/map/tools';
import { getNameOfFeatureType } from '~/model/features';
import { globalIdToFeatureId } from '~/model/identifiers';
import { selectionForSubset } from '~/selectors/selection';
import { selectOrdered } from '~/utils/collections';
import { chooseUniqueId, chooseUniqueName } from '~/utils/naming';
import { EMPTY_ARRAY } from '~/utils/redux';
import { Tool } from '~/views/map/tools';

/**
 * Selector that calculates and caches the list of all the features in the
 * state object, in exactly the same order as they should appear on the UI.
 */
export const getFeaturesInOrder = createSelector(
  (state) => state.features,
  selectOrdered
);

/**
 * Returns the object representing a feature given its ID, or undefined
 * if there is no such feature.
 */
export const getFeatureById = (state, featureId) =>
  state.features.byId[featureId];

/**
 * Proposes an ID to use for a new feature that is to be added to the
 * state store.
 *
 * @param {object}  state    the current state object
 * @param {object}  feature  the feature to add
 * @param {string?} name     an optional name (label) that serves as a basis
 *        for the ID of the feature
 */
export const getProposedIdForNewFeature = (state, feature, name) => {
  const { type } = feature;

  if (!type) {
    throw new Error('Feature must have a type');
  }

  if (!name) {
    // Generate a sensible name if no name was given
    const existingNames = map(state.byId, (feature) => feature.id);
    const nameBase = capitalize(getNameOfFeatureType(type));
    name = chooseUniqueName(nameBase, existingNames);
  }

  // Create an ID from the camel-cased variant of the name and ensure
  // that it is unique
  const existingIds = Object.keys(state.features.byId);
  return chooseUniqueId(camelCase(name), existingIds);
};

/**
 * Selector that returns whether the points of a feature with a given id should
 * be shown.
 */
export const shouldShowPointsOfFeature = createSelector(
  getSelectedTool,
  (state, featureId) => state.features.byId[featureId],
  (selectedTool, feature) =>
    selectedTool === Tool.EDIT_FEATURE || Boolean(feature?.showPoints)
);

/**
 * Selector that returns an object that stores features by their ids.
 */
export const getFeaturesByIds = (state) => state.features.byId;

/**
 * Selector that returns the id of the feature currently being edited.
 */
export const getEditedFeatureId = (state) =>
  state.dialogs.featureEditor.featureId;

/**
 * Selector that determines whether the feature editor dialog is open.
 */
export const getEditorDialogVisibility = (state) =>
  state.dialogs.featureEditor.dialogVisible;

/**
 * Selector that determines the selected tab of the feature editor dialog.
 */
export const getSelectedTab = (state) =>
  state.dialogs.featureEditor.selectedTab;

/**
 * Selector that calculates and caches the list of selected feature IDs from
 * the state object.
 */
export const getSelectedFeatureIds = selectionForSubset(globalIdToFeatureId);

/**
 * Selector that returns the ID of the selected feature if there is exactly one
 * feature selected, or undefined otherwise.
 */
export const getSingleSelectedFeatureId = createSelector(
  getSelectedFeatureIds,
  (featureIds) => (featureIds.length === 1 ? featureIds[0] : undefined)
);

/**
 * Selector that returns the ID of the selected feature in an array of length 1
 * if there is exactly one feature selected, or an empty array otherwise.
 */
export const getSingleSelectedFeatureIdAsArray = createSelector(
  getSelectedFeatureIds,
  (featureIds) => (featureIds.length === 1 ? featureIds : EMPTY_ARRAY)
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
  (state) => state.features.byId,
  (featureIds, features) =>
    reject(
      featureIds.map((featureId) => features[featureId]),
      isNil
    ).map((feature) => feature.label)
);

/**
 * Selector that retrieves the list of the types of the selected features
 * from the state object.
 *
 * @param  {Object}  state  the state of the application
 * @return {string[]}  the list of selected feature types
 */
export const getSelectedFeatureTypes = createSelector(
  getSelectedFeatureIds,
  (state) => state.features.byId,
  (featureIds, features) =>
    reject(
      featureIds.map((featureId) => features[featureId]),
      isNil
    ).map((feature) => feature.type)
);
