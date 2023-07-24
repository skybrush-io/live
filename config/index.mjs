/**
 * @file File for merging the default config with overrides from external files.
 */
import isArray from 'lodash-es/isArray.js';
import mergeWith from 'lodash-es/mergeWith.js';

import defaults from './defaults.mjs';
import overrides from 'config-overrides';

// Completely replace arrays in the configuration instead of merging them.
const customizer = (defaultValue, overrideValue) => {
  if (isArray(defaultValue) && isArray(overrideValue)) {
    return overrideValue;
  }
};

export default mergeWith(defaults, overrides, customizer);
