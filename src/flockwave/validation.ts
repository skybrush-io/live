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
export function validateExtensionName(name: string): void {
  if (typeof name !== 'string' || name.includes('.')) {
    throw new Error(`Invalid extension name: ${name}`);
  }
}

/**
 * Checks whether the given string can be a valid object ID on a
 * Flockwave server.
 *
 * Raises an exception if the given name is not a valid object ID.
 */
export function validateObjectId(name: string): void {
  if (typeof name !== 'string' || name.length === 0) {
    throw new Error(`Invalid object ID: ${name}`);
  }
}
