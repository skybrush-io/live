/**
 * Helper function to convert a JavaScript object into a string that can be
 * used as an attribute value for an A-Frame entity.
 */
export function objectToString<T>(
  object: Record<string, T> | ArrayLike<T>
): string {
  return (
    Object.entries(object)
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ')
  );
}
