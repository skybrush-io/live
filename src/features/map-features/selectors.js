import camelCase from 'lodash-es/camelCase';
import capitalize from 'lodash-es/capitalize';
import map from 'lodash-es/map';

import { getNameOfFeatureType } from '~/model/features';
import { chooseUniqueId, chooseUniqueName } from '~/utils/naming';

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
