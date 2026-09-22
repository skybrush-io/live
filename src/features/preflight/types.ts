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

export type PreflightCheckHeaderOrItem = {
  id: Identifier;
  label: string;
  type?: 'header' | 'item';
};
