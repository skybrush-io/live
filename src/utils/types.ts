// NOTE: The `Record` type alias cannot be used here, as it makes the TypeScript
//       compiler unable to figure out if these recursive types are safe or not.
//       See:
//       ∙ https://github.com/microsoft/TypeScript/issues/41164
//       ∙ https://github.com/typescript-eslint/typescript-eslint/issues/2687
// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
export type NestedRecord<T> = { [key: string]: NestedRecordField<T> };
export type NestedRecordField<T> = T | NestedRecord<T>;

// TODO: Use `NonEmptyTuple` from 'type-fest' instead?
export type NonEmptyArray<T> = [T, ...T[]];

// NOTE: TypeScript makes it more convenient to work with `undefined`,
//       but in certain situations `null` is still useful / necessary.
// eslint-disable-next-line @typescript-eslint/ban-types
export type Nullable<T> = T | null;

// NOTE: While `ReadonlyTuple` from 'type-fest' looks similar, using it results
//       in the following error: "This overload signature is not compatible with
//       its implementation signature. [2394]"
export type Tuple<
  T,
  N extends number,
  // eslint-disable-next-line @typescript-eslint/ban-types
  R extends T[] = [],
> = R['length'] extends N ? R : Tuple<T, N, [T, ...R]>;
