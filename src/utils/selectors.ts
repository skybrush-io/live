/**
 * Selector-related utility functions.
 */

import isEqual from 'lodash-es/isEqual';
import { createSelectorCreator, lruMemoize } from 'reselect';
import shallowEqual from 'shallowequal';

/**
 * Selector creator function that creates selectors that use _shallow_ equality
 * checks on the _input_ arguments.
 */
export const createShallowSelector = createSelectorCreator({
  memoize: lruMemoize,
  memoizeOptions: {
    equalityCheck: shallowEqual,
  },
});

/**
 * Selector creator function that creates selectors that use _deep_ equality
 * checks on the _output_ arguments.
 */
export const createDeepResultSelector = createSelectorCreator({
  memoize: lruMemoize,
  memoizeOptions: {
    resultEqualityCheck: isEqual,
  },
});
