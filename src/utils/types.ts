// NOTE: The `Record` type alias cannot be used here, as it makes the TypeScript
//       compiler unable to figure out if these recursive types are safe or not.
//       See:
//       ∙ https://github.com/microsoft/TypeScript/issues/41164
//       ∙ https://github.com/typescript-eslint/typescript-eslint/issues/2687

export type NestedRecord<T> = { [key: string]: NestedRecordField<T> };
export type NestedRecordField<T> = T | NestedRecord<T>;

// NOTE: TypeScript makes it more convenient to work with `undefined`,
//       but in certain situations `null` is still useful / necessary.
export type Nullable<T> = T | null;

/**
 * Type goard for booleans for cases where we need a function instead of a typeof check.
 */
export const isBoolean = (value: unknown): value is boolean =>
  typeof value === 'boolean';

/**
 * Type guard that checks whether a value is a plain object-like record.
 */
export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * Factory function that creates a type guard for checking if a token is a value of an
 * enum.
 *
 * @param e   the enum to check against
 * @returns a type guard function that checks if a token is a value of the enum
 */
export const isSomeEnum =
  <T extends Record<string, unknown>>(e: T) =>
  (token: any): token is T[keyof T] =>
    Object.values(e).includes(token as T[keyof T]);
