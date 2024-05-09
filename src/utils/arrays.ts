import { type Nullable } from './types';

// NOTE: This might be unnecessary after TypeScript 5.5 infers type predicates:
//       https://devblogs.microsoft.com/typescript/announcing-typescript-5-5/#inferred-type-predicates
export const rejectNullish = <T>(items: Array<Nullable<T> | undefined>): T[] =>
  items.filter((item): item is T => item !== undefined && item !== null);
