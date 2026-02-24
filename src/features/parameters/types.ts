import type { Identifier } from '~/utils/collections';

export type ParameterData = {
  name: string;
  uavId: string | undefined;
  value: string;
};

export type Parameter = ParameterData & {
  id: Identifier;
};
