import type { Identifier } from '~/utils/collections';

export type ParameterData = {
  name: string;
  uavId: string | undefined;
  value: unknown;
};

export type Parameter = ParameterData & {
  id: Identifier;
};
