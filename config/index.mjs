/**
 * @file File for merging the default config with overrides from external files.
 */
import merge from 'lodash-es/merge.js';
import defaults from './defaults.mjs';
import overrides from 'config-overrides';

export default merge(defaults, overrides);
