import camelCase from 'lodash-es/camelCase';
import capitalize from 'lodash-es/capitalize';
import map from 'lodash-es/map';

import { createSelector } from '@reduxjs/toolkit';

import {
  type Feature,
  type FeatureType,
  getNameOfFeatureType,
} from '~/model/features';
import { globalIdToFeatureId } from '~/model/identifiers';
import { selectionForSubset } from '~/selectors/selection';
import { type AppSelector } from '~/store/reducers';
import { rejectNullish } from '~/utils/arrays';
import {
  type Collection,
  type Identifier,
  selectOrdered,
} from '~/utils/collections';
import { chooseUniqueId, chooseUniqueName } from '~/utils/naming';
import { EMPTY_ARRAY } from '~/utils/redux';

import {
  type FeatureEditorDialogTab,
  type FeatureWithProperties,
} from './types';

/**
 * Selector that returns a list of map feature IDs with a mapping from these
 * IDs to their stored representations.
 */
export const getFeaturesAsCollection: AppSelector<
  Collection<FeatureWithProperties>
> = (state) => state.features;

/**
 * Selector that returns an object that stores features by their IDs.
 */
export const getFeaturesById: AppSelector<
  Record<Identifier, FeatureWithProperties>
> = (state) => state.features.byId;

/**
 * Selector that calculates and caches the list of all the features in the
 * state object, in exactly the same order as they should appear on the UI.
 */
export const getFeaturesInOrder: AppSelector<FeatureWithProperties[]> =
  createSelector(getFeaturesAsCollection, selectOrdered);

/**
 * Returns the object representing a feature given its ID, or undefined
 * if there is no such feature.
 */
export const getFeatureById: AppSelector<
  FeatureWithProperties | undefined,
  [Identifier]
> = (state, featureId) => state.features.byId[featureId];

/**
 * Proposes an ID to use for a new feature that is to be added to the
 * state store.
 *
 * @param state - The current state object
 * @param feature - The feature to add
 * @param name - An optional name (label) that serves as a basis
 *               for the ID of the feature
 */
export const getProposedIdForNewFeature: AppSelector<
  string,
  [Feature, string | undefined]
> = (state, feature, name) => {
  const { type } = feature;

  if (!type) {
    throw new Error('Feature must have a type');
  }

  if (!name) {
    // Generate a sensible name if no name was given
    const existingNames = map(getFeaturesById(state), (feature) => feature.id);
    const nameBase = capitalize(getNameOfFeatureType(type));
    name = chooseUniqueName(nameBase, existingNames);
  }

  // Create an ID from the camel-cased variant of the name and ensure
  // that it is unique
  const existingIds = Object.keys(state.features.byId);
  return chooseUniqueId(camelCase(name), existingIds);
};

/**
 * Selector that returns the id of the feature currently being edited.
 */
export const getEditedFeatureId: AppSelector<Identifier | undefined> = (
  state
) => state.dialogs.featureEditor.featureId;

/**
 * Selector that determines whether the feature editor dialog is open.
 */
export const getEditorDialogVisibility: AppSelector<boolean> = (state) =>
  state.dialogs.featureEditor.dialogVisible;

/**
 * Selector that determines the selected tab of the feature editor dialog.
 */
export const getSelectedTab: AppSelector<FeatureEditorDialogTab> = (state) =>
  state.dialogs.featureEditor.selectedTab;

/**
 * Selector that calculates and caches the list of selected feature IDs from
 * the state object.
 */
export const getSelectedFeatureIds = selectionForSubset(globalIdToFeatureId);

/**
 * Selector that returns the IDs for a subset of the selected features that are
 * of the specified feature type.
 */
export const getSelectedFeatureIdsByType = (
  featureType: FeatureType
): AppSelector<Identifier[]> =>
  createSelector(
    getSelectedFeatureIds,
    getFeaturesById,
    (featureIds, features) =>
      featureIds.filter((id) => features?.[id]?.type === featureType)
  );

/**
 * Selector that returns the ID of the selected feature if there is exactly one
 * feature selected, or undefined otherwise.
 */
export const getSingleSelectedFeatureId: AppSelector<Identifier | undefined> =
  createSelector(getSelectedFeatureIds, (featureIds) =>
    featureIds.length === 1 ? featureIds[0] : undefined
  );

/**
 * Selector that returns the ID of a selected feature of a given type if there
 * is exactly one such feature selected, or undefined otherwise.
 */
export const getSingleSelectedFeatureIdOfType = (
  featureType: FeatureType
): AppSelector<Identifier | undefined> =>
  createSelector(getSelectedFeatureIdsByType(featureType), (featureIds) =>
    featureIds.length === 1 ? featureIds[0] : undefined
  );

/**
 * Selector that returns the ID of the selected feature in an array of length 1
 * if there is exactly one feature selected, or an empty array otherwise.
 */
export const getSingleSelectedFeatureIdAsArray: AppSelector<Identifier[]> =
  createSelector(getSelectedFeatureIds, (featureIds) =>
    featureIds.length === 1 ? featureIds : EMPTY_ARRAY
  );

/**
 * Selector that retrieves the list of selected features from the state object.
 *
 * @param state - The state of the application
 * @returns The list of selected features
 */
export const getSelectedFeatures: AppSelector<FeatureWithProperties[]> =
  createSelector(
    getSelectedFeatureIds,
    getFeaturesById,
    (featureIds, features) =>
      rejectNullish(featureIds.map((featureId) => features[featureId]))
  );

/**
 * Selector that retrieves the list of the labels of the selected features
 * from the state object.
 *
 * @param state - The state of the application
 * @returns The list of selected feature labels
 */
export const getSelectedFeatureLabels: AppSelector<Array<string | undefined>> =
  createSelector(getSelectedFeatures, (features) =>
    features.map((feature) => feature.label)
  );

/**
 * Selector that retrieves the list of the types of the selected features
 * from the state object.
 *
 * @param state - The state of the application
 * @returns The list of selected feature types
 */
export const getSelectedFeatureTypes: AppSelector<FeatureType[]> =
  createSelector(getSelectedFeatures, (features) =>
    features.map((feature) => feature.type)
  );
