/**
 * @file Operator factory functions.
 */

/**
 * Helper function that creates a function that prepends some string to its
 * first input argument.
 *
 * @param prefix - The prefix to prepend
 * @returns A function that will take a string and append it to the given prefix
 */
export const appendTo: (prefix: string) => (input: string) => string =
  (prefix) => (input) =>
    prefix + input;

/**
 * Helper function that creates another function that returns whether a string
 * starts with a prefix.
 *
 * @param prefix - The prefix to test
 * @returns A function that will take a string and return
 *          whether it starts with the given prefix
 */
export const hasPrefix: (prefix: string) => (input: string) => boolean =
  (prefix) => (input) =>
    // TODO: Remove conditional chaining, when it is ensured, that only strings
    //       will be passed at the calling locations! (Currently sometimes we
    //       get undefined due to e.g. not all OpenLayers features having ids.)
    //       [Presently graticules would cause a crash on "fit all drones"
    //       without this check.]
    input?.startsWith(prefix);

/**
 * Helper function that creates a function that strips some prefix from its
 * first input argument. The function will return undefined if the input
 * argument does not start with the prefix.
 *
 * @param prefix - The prefix to strip
 * @returns A function that will take a string
 *          and strip the given prefix from it
 */
export const stripPrefix: (
  prefix: string
) => (input: string) => string | undefined = (prefix) => (input) => {
  if (input.startsWith(prefix)) {
    return input.slice(prefix.length);
  }

  return undefined;
};
