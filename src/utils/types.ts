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
