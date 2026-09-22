import { type GPSPosition } from '~/model/geography';
import { type Identifier } from '~/utils/collections';

export type BeaconProperties = {
  position?: GPSPosition;
  heading?: number;
  active?: boolean;
  name?: string;
};
export type BeaconPropertiesMap = Record<Identifier, BeaconProperties>;

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
export type Beacon = BeaconProperties & {
  id: Identifier;
};
