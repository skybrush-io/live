import { type Identifier } from '~/utils/collections';

export type PreflightCheckGroup = {
  id: Identifier;
  label: string;
};

export type PreflightCheckItem = {
  id: Identifier;
  label: string;
  groupId: string;
};
