/**
 * Selector-related utility functions.
 */

import isEqual from 'lodash-es/isEqual';
import { defaultMemoize, createSelectorCreator } from 'reselect';
import * as shallowEqual from 'shallowequal';

/**
 * Selector creator function that creates selectors that use shallow equality
 * checks on the input arguments.
 */
export const createShallowSelector = createSelectorCreator(
  defaultMemoize,
  shallowEqual
);

export const createDeepResultSelector = createSelectorCreator(defaultMemoize, {
  resultEqualityCheck: isEqual,
});
