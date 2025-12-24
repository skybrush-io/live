/**
 * Selector-related utility functions.
 */

import isEqual from 'lodash-es/isEqual';
import { createSelectorCreator, lruMemoize } from 'reselect';
import shallowEqual from 'shallowequal';

/**
 * Selector creator function that creates selectors that use shallow equality
 * checks on the input arguments.
 */
export const createShallowSelector = createSelectorCreator(
  lruMemoize,
  shallowEqual
);

export const createDeepResultSelector = createSelectorCreator(lruMemoize, {
  resultEqualityCheck: isEqual,
});
