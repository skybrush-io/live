import { type GPSPosition } from '~/model/position';
import { type Identifier } from '~/utils/collections';

/**
 * @example
 * {
 *   id: 'BCN:GPS',
 *   position: ...,
 *   heading: 147,
 *   active: true,
 *   name: 'GPS beacon'
 * }
 */
export type Beacon = {
  id: Identifier;
  position?: GPSPosition;
  heading?: number;
  active: boolean;
  name?: string;
};
