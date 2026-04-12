import type { Identifier, ItemLike } from '~/utils/collections';

export type SelectionGroupData = {
  name: string;
  ids: Identifier[];
};

export type SelectionGroup = ItemLike & SelectionGroupData;
