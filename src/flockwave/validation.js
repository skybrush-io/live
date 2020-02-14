/**
 * Common functions related to validation tasks in incoming and outgoing
 * messages.
 */

/**
 * Checks whether the given object is the name of a valid extension on a
 * Flockwave server.
 *
 * Raises an exception if the given name is not a valid extension name.
 */
export function validateExtensionName(name) {
  if (typeof name !== 'string' || name.includes('.')) {
    throw new Error(`Invalid extension name: ${name}`);
  }
}
