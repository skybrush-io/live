import { type Identifier } from '~/utils/collections';

/**
 * NOTE: This seems not to actually be used currently, so I didn't put much
 * effort into precisely annotating it, but in case it becomes active again,
 * it would deserve some more attention. (e.g. matching column ids, etc.)
 *
 * @example
 * {
 *     id: 123,
 *     meta: {
 *         title: 'Example dataset',
 *         columns: ['columnId1', 'columnId2', ...]
 *     },
 *     data: {
 *         columnId1: {
 *             values: [123, 456, ...],
 *             title: 'Column title'
 *         },
 *         ...
 *     }
 * }
 */
export type Dataset = {
  id: Identifier;
  meta: {
    title: string;
    columns: string[];
  };
  data: Record<
    string,
    {
      title: string;
      values: unknown[];
    }
  >;
};
