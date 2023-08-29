import { type Identifier } from '~/utils/collections';

/**
 * @example
 * {
 *   id: 'gps',
 *   name: 'GPS connection',
 *   state: 'disconnected',
 *   stateChangedAt: 1234567
 * }
 */
export type ConnectionProperties = {
  id: Identifier;
  name: string;
  state: string;
  stateChangedAt?: number;
};
