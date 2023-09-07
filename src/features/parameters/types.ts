import { type Identifier } from '~/utils/collections';

export type Parameter = {
  id: Identifier;
  name: string;
  value: unknown;
};
