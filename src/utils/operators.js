/**
 * @file Operator factory functions.
 */

/**
 * Helper function that creates a function that prepends some string to its
 * first input argument.
 *
 * @param  {string} prefix  the prefix to prepend
 * @return {function} a function that will take a string and append it to
 *         the given prefix
 */
export function appendTo(prefix) {
  return (input) => prefix + input;
}

/**
 * Helper function that creates another function that appends some items to
 * a list.
 *
 * @param {Object[]} items  the items to append
 * @return {function} a function that will take an array or a falsey value
 *         and return another array that contains the items of the original
 *         array plus the items specified in <code>items</code>; falsey
 *         values passed to the function are treated as an empty array
 */
export function extendWith(...items) {
  return (array) => (array || []).concat(items);
}

/**
 * Helper function that creates another function that returns whether a string
 * starts with a prefix.
 *
 * @param  {string} prefix  the prefix to test
 * @return {function} a function that will take a string and return whether it
 *         starts with the given prefix
 */
export function hasPrefix(prefix) {
  return (input) => typeof input === 'string' && input.startsWith(prefix);
}

/**
 * Helper function that creates a function that strips some prefix from its
 * first input argument. The function will return undefined if the input
 * argument does not start with the prefix.
 *
 * @param  {string} prefix  the prefix to strip
 * @return {function} a function that will take a string and strip the given
 *         prefix from it
 */
export function stripPrefix(prefix) {
  return (input) => {
    if (input && input.startsWith(prefix)) {
      return input.slice(prefix.length);
    }

    return undefined;
  };
}
