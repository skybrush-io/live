/**
 * @file File for merging the default config with overrides from external files.
 */
import mergeWith from 'lodash-es/mergeWith.js';

import { type Config } from 'config';
import overrides from 'config-overrides';

import defaults from './defaults';

// Completely replace arrays in the configuration instead of merging them.
const customizer = <T>(
  defaultValue: unknown,
  overrideValue: T
): T | undefined => {
  if (Array.isArray(defaultValue) && Array.isArray(overrideValue)) {
    return overrideValue;
  }
};

const merged: Config = mergeWith(defaults, overrides, customizer);
export default merged;
