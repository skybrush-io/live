/**
 * @file Operator factory functions.
 */

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
export function extendWith (...items) {
  return array => (array || []).concat(items)
}
