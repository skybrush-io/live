import { isObject } from 'lodash-es';

import { type GPSFixType } from './enums';

export type GPSFix = {
  type: GPSFixType;
  numSatellites?: number;
  horizontalAccuracy?: number;
  verticalAccuracy?: number;
};

export type GPSPosition = {
  lat: number;
  lon: number;
  amsl?: number;
  ahl?: number;
  agl?: number;
};

/**
 * Returns whether the given input represents a valid position.
 */
export const isValidPosition = (position: unknown): position is GPSPosition =>
  // prettier-ignore
  isObject(position)
  && ( ('lat'  in position) && typeof position.lat  === 'number')
  && ( ('lon'  in position) && typeof position.lon  === 'number')
  && (!('amsl' in position) || typeof position.amsl === 'number')
  && (!('ahl'  in position) || typeof position.ahl  === 'number')
  && (!('agl'  in position) || typeof position.agl  === 'number');
