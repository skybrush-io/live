/**
 * Helper function to convert a JavaScript object into a string that can be
 * used as an attribute value for an A-Frame entity.
 */
export function objectToString(object) {
  return Object.entries(object)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');
}
