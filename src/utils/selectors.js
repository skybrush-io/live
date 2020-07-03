/**
 * Selector-related utility functions.
 */

import { defaultMemoize, createSelectorCreator } from 'reselect';
import shallowEqual from 'shallowequal';

/**
 * Selector creator function that creates selectors that use shallow equality
 * checks on the input arguments.
 */
export const createShallowSelector = createSelectorCreator(
  defaultMemoize,
  shallowEqual
);

console.log(createShallowSelector, shallowEqual);
