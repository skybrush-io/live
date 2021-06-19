import camelCase from 'lodash-es/camelCase';
import capitalize from 'lodash-es/capitalize';
import map from 'lodash-es/map';

import { getNameOfFeatureType } from '~/model/features';
import { chooseUniqueId, chooseUniqueName } from '~/utils/naming';

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
