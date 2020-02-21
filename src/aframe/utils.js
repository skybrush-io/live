/**
 * Helper function to convert a JavaScript object into a string that can be
 * used as an attribute value for an A-Frame entity.
 */
export function objectToString(obj) {
  return Object.entries(obj)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ');
}
