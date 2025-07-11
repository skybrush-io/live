import { type Nullable } from './types';

export const circularGet = <T>(array: T[], index: number): T | undefined =>
  array.at(index % array.length);

export const circularSet = <T>(array: T[], index: number, value: T): void => {
  array[((index % array.length) + array.length) % array.length] = value;
};

// TODO: These can error on empty arrays... Return undefined instead?

export const maxWith = <T>(array: T[], compareFn: (a: T, b: T) => number): T =>
  array.reduce((previousValue, currentValue) =>
    compareFn(currentValue, previousValue) > 0 ? currentValue : previousValue
  );

export const minWith = <T>(array: T[], compareFn: (a: T, b: T) => number): T =>
  array.reduce((previousValue, currentValue) =>
    compareFn(currentValue, previousValue) < 0 ? currentValue : previousValue
  );

// TODO: minIndexWith?, maxIndexWith? Return both value and index?

// NOTE: This might be unnecessary after TypeScript 5.5 infers type predicates:
//       https://devblogs.microsoft.com/typescript/announcing-typescript-5-5/#inferred-type-predicates
export const rejectNullish = <T>(items: Array<Nullable<T> | undefined>): T[] =>
  items.filter((item): item is T => item !== undefined && item !== null);
